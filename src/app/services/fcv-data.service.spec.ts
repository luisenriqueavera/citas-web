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
});
