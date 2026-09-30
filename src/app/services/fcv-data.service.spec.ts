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
});
