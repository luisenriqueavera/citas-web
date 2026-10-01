import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {FcvDataService} from './fcv-data.service';

describe('FcvDataService REST scheduling', () => {
  let service: FcvDataService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [FcvDataService, provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(FcvDataService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads availability from the API and creates a reservation with the API status', () => {
    service.loadAvailability({date: '2030-01-15'}).subscribe(options => expect(options[0].slotIds).toEqual([1]));
    const availability = http.expectOne('/api/v1/availability?date=2030-01-15');
    availability.flush([{id: '1', professionalId: 1, locationId: 1, specialtyId: 1, specialtyName: 'Medicina General', professionalCode: 'P-1', locationName: 'HIC', startAt: '2030-01-15T08:00:00', endAt: '2030-01-15T08:30:00', slotIds: [1], general: true}]);

    service.createAppointment({patientUserId: 100, professionalId: 1, locationId: 1, specialtyId: 1, slotIds: [1]}).subscribe(response => expect(response.status).toBe('APPROVED'));
    const reservation = http.expectOne('/api/v1/appointments');
    expect(reservation.request.method).toBe('POST');
    reservation.flush({id: 1, status: 'APPROVED', slotIds: [1]});
  });

  it('loads active insurance plans and registers without forcing a plan', () => {
    service.loadActiveInsurancePlans().subscribe(plans => expect(plans).toEqual([
      {id: 1, epsName: 'EPS Demo A', name: 'Plan Demo 1'},
    ]));
    const plans = http.expectOne('/api/insurance-plans');
    expect(plans.request.method).toBe('GET');
    plans.flush([{id: 1, epsName: 'EPS Demo A', name: 'Plan Demo 1'}]);

    service.registerUser({
      firstName: 'Ana', lastName: 'Prueba', documentType: 'CC', documentNumber: '123',
      email: 'ana@example.test', phone: '3000000000', password: 'Secure123*',
    }).subscribe();
    const registration = http.expectOne('/api/auth/register');
    expect(registration.request.method).toBe('POST');
    expect(registration.request.body.insurancePlanId).toBeUndefined();
    registration.flush({id: 1, email: 'ana@example.test', roles: ['USER']});
  });

  it('loads my appointments and maps backend status codes to Spanish UI labels', () => {
    service.loadMyAppointments().subscribe();
    const req = http.expectOne('/api/v1/me/appointments');
    expect(req.request.method).toBe('GET');
    req.flush([{
      id: 42, professionalId: 1, locationId: 1, specialtyId: 2, status: 'REQUESTED',
      scheduledStartAt: '2031-01-15T10:00:00', scheduledEndAt: '2031-01-15T11:00:00',
      durationMinutes: 60, reason: 'Control', rejectionReason: null,
    }]);
    expect(service.apiMyCitas()[0].estado).toBe('Pendiente de aprobación');
  });

  it('cancels an appointment with a POST to the cancel endpoint', () => {
    service.cancelAppointment(42).subscribe(response => expect(response.status).toBe('CANCELLED'));
    const req = http.expectOne('/api/v1/me/appointments/42/cancel');
    expect(req.request.method).toBe('POST');
    req.flush({id: 42, status: 'CANCELLED'});
  });

  it('requests a reschedule with the given slot ids and reason', () => {
    service.requestReschedule(42, {slotIds: [7], reason: 'Cruce de horario'}).subscribe(response => expect(response.status).toBe('PENDING'));
    const req = http.expectOne('/api/v1/me/appointments/42/reschedule-requests');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({slotIds: [7], reason: 'Cruce de horario'});
    req.flush({id: 1, appointmentId: 42, status: 'PENDING', slotIds: [7]});
  });

  it('loads the professional agenda with query params', () => {
    service.loadMyAgenda({date: '2031-01-15'}).subscribe(rows => expect(rows[0].patientName).toBe('Ana Prueba'));
    const req = http.expectOne('/api/v1/professional/appointments?date=2031-01-15');
    expect(req.request.method).toBe('GET');
    req.flush([{
      id: 1, patientUserId: 100, patientName: 'Ana Prueba', locationId: 1, specialtyId: 1, status: 'APPROVED',
      scheduledStartAt: '2031-01-15T09:00:00', scheduledEndAt: '2031-01-15T09:30:00', durationMinutes: 30, reason: null,
    }]);
  });

  it('closes an appointment with the given outcome', () => {
    service.closeAppointment(1, 'COMPLETED').subscribe(response => expect(response.status).toBe('COMPLETED'));
    const req = http.expectOne('/api/v1/professional/appointments/1/close');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({outcome: 'COMPLETED'});
    req.flush({id: 1, status: 'COMPLETED'});
  });

  it('requests and confirms a password reset', () => {
    service.requestPasswordReset('ana@example.test').subscribe(response => expect(response.devToken).toBe('dev-token-123'));
    const requestReq = http.expectOne('/api/auth/password-reset/request');
    expect(requestReq.request.method).toBe('POST');
    requestReq.flush({message: 'ok', devToken: 'dev-token-123'});

    service.confirmPasswordReset('dev-token-123', 'NuevaClave123*').subscribe();
    const confirmReq = http.expectOne('/api/auth/password-reset/confirm');
    expect(confirmReq.request.method).toBe('POST');
    expect(confirmReq.request.body).toEqual({token: 'dev-token-123', newPassword: 'NuevaClave123*'});
    confirmReq.flush({});
  });

  it('loads and creates EPS through the admin catalog endpoints', () => {
    service.loadEps().subscribe(rows => expect(rows[0].code).toBe('EPS_DEMO_A'));
    const listReq = http.expectOne('/api/v1/admin/eps');
    listReq.flush([{id: 1, code: 'EPS_DEMO_A', name: 'EPS Demo A', active: true, plans: []}]);

    service.createEps('EPS_NUEVA', 'EPS Nueva').subscribe();
    const createReq = http.expectOne('/api/v1/admin/eps');
    expect(createReq.request.method).toBe('POST');
    expect(createReq.request.body).toEqual({code: 'EPS_NUEVA', name: 'EPS Nueva'});
    createReq.flush({});

    service.changeEpsStatus(1, false).subscribe();
    const toggleReq = http.expectOne('/api/v1/admin/eps/1/active');
    expect(toggleReq.request.method).toBe('PATCH');
    expect(toggleReq.request.body).toEqual({active: false});
    toggleReq.flush({});
  });
});
