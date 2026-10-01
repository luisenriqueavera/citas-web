import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FcvDataService } from '../../../services/fcv-data.service';
import { Cita, AppointmentStatus, AuditEvent, AvailabilityOption } from '../../../models/fcv.models';

@Component({
  selector: 'app-mis-citas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Encabezado con Métricas -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <nav class="flex items-center gap-1.5 text-xs text-outline mb-1" aria-label="Ruta de navegación">
            <span>Portal Paciente</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="text-on-surface font-semibold">Mis Citas</span>
          </nav>
          <h1 class="font-headline-md text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Mis Citas, Historial y Reprogramación
          </h1>
          <p class="text-xs text-on-surface-variant mt-1">
            Historial completo de citas asignadas, interconsultas solicitadas y trazabilidad clínica del paciente.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
            {{ activeCount() }} Activas
          </span>
          <span class="px-3 py-1 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-bold">
            {{ historyCount() }} Históricas
          </span>
        </div>
      </div>

      <!-- Filtros por Estado (Pills Horizontales) -->
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        <button
          type="button"
          (click)="selectedStatusFilter.set('todas')"
          [class]="selectedStatusFilter() === 'todas'
            ? 'bg-primary text-on-primary font-bold shadow-xs'
            : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'"
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          Todas ({{ fcvService.myCitas().length }})
        </button>
        <button
          type="button"
          (click)="selectedStatusFilter.set('Confirmada')"
          [class]="selectedStatusFilter() === 'Confirmada'
            ? 'bg-primary text-on-primary font-bold shadow-xs'
            : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'"
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          Confirmada ({{ countByStatus('Confirmada') }})
        </button>
        <button
          type="button"
          (click)="selectedStatusFilter.set('Pendiente de aprobación')"
          [class]="selectedStatusFilter() === 'Pendiente de aprobación'
            ? 'bg-primary text-on-primary font-bold shadow-xs'
            : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'"
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          Pendiente ({{ countByStatus('Pendiente de aprobación') }})
        </button>
        <button
          type="button"
          (click)="selectedStatusFilter.set('Rechazada')"
          [class]="selectedStatusFilter() === 'Rechazada'
            ? 'bg-primary text-on-primary font-bold shadow-xs'
            : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'"
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          Rechazada ({{ countByStatus('Rechazada') }})
        </button>
        <button
          type="button"
          (click)="selectedStatusFilter.set('Realizada')"
          [class]="selectedStatusFilter() === 'Realizada'
            ? 'bg-primary text-on-primary font-bold shadow-xs'
            : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'"
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          Realizada ({{ countByStatus('Realizada') }})
        </button>
        <button
          type="button"
          (click)="selectedStatusFilter.set('Cancelada')"
          [class]="selectedStatusFilter() === 'Cancelada'
            ? 'bg-primary text-on-primary font-bold shadow-xs'
            : 'bg-surface-container-lowest text-on-surface-variant border border-outline-variant/40 hover:bg-surface-container'"
          class="px-3.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          Cancelada ({{ countByStatus('Cancelada') }})
        </button>
      </div>

      <!-- Lista de citas con trazabilidad lateral -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Columna Izquierda: Tarjetas de Citas (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          @for (cita of filteredCitas(); track cita.id) {
            <div
              tabindex="0"
              role="button"
              (keydown.enter)="selectCita(cita)"
              (keydown.space)="selectCita(cita)"
              class="rounded-3xl bg-surface-container-lowest p-5 sm:p-6 border transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              [class]="selectedCita()?.id === cita.id
                ? 'border-primary ring-2 ring-primary/20 bg-primary-fixed/10'
                : 'border-outline-variant/40 hover:border-outline-variant'"
              (click)="selectCita(cita)"
            >
              <!-- Card Header -->
              <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30 mb-4">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-primary">{{ cita.codigo }}</span>
                  <span class="text-outline text-xs">·</span>
                  <span class="text-xs font-semibold text-on-surface">{{ cita.especialidad }}</span>
                </div>

                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  [class]="getStatusBadgeClass(cita.estado)"
                >
                  {{ cita.estado }}
                </span>
              </div>

              <!-- Professional & Campus Info -->
              <div class="space-y-2 mb-4 text-xs">
                <div class="flex items-center justify-between">
                  <span class="text-outline">Profesional:</span>
                  <span class="font-bold text-on-surface">{{ cita.profesionalNombre }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-outline">Fecha & Hora:</span>
                  <span class="font-bold text-primary">{{ cita.fechaTexto }} · {{ cita.hora }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-outline">Sede:</span>
                  <span class="font-medium text-on-surface-variant">{{ cita.sede }}</span>
                </div>
              </div>

              <!-- Motivo permanente de rechazo si aplica -->
              @if (cita.estado === 'Rechazada' && cita.motivoRechazo) {
                <div class="p-3 rounded-2xl bg-error-container/40 border border-error/20 text-xs text-on-error-container mb-4">
                  <span class="font-bold block mb-0.5">Motivo registrado institucional:</span>
                  <p class="text-[11px] leading-relaxed">{{ cita.motivoRechazo }}</p>
                </div>
              }

              <!-- Acciones de la tarjeta -->
              <div class="pt-3 border-t border-outline-variant/30 flex items-center justify-between flex-wrap gap-2">
                <button
                  type="button"
                  (click)="selectCita(cita); $event.stopPropagation()"
                  class="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span class="material-symbols-outlined text-base">history_edu</span>
                  <span>Ver trazabilidad</span>
                </button>

                <div class="flex items-center gap-2">
                  @if (cita.estado === 'Confirmada') {
                    <button
                      type="button"
                      (click)="openRescheduleModal(cita); $event.stopPropagation()"
                      class="px-3 py-1.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                    >
                      Reprogramar
                    </button>
                    <button
                      type="button"
                      (click)="openCancelModal(cita); $event.stopPropagation()"
                      class="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-semibold text-error hover:bg-error-container/40 border border-error/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  }
                  @if (cita.estado === 'Pendiente de aprobación') {
                    <button
                      type="button"
                      (click)="openCancelModal(cita); $event.stopPropagation()"
                      class="px-3 py-1.5 rounded-xl bg-surface-container-lowest text-xs font-semibold text-error hover:bg-error-container/40 border border-error/20 transition-colors"
                    >
                      Cancelar
                    </button>
                  }
                  @if (cita.estado === 'Rechazada') {
                    <a
                      routerLink="/paciente/buscar-disponibilidad"
                      (click)="$event.stopPropagation()"
                      class="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors"
                    >
                      Buscar nueva fecha
                    </a>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 text-center text-xs text-outline">
              No tiene citas registradas con el filtro seleccionado.
            </div>
          }
        </div>

        <!-- Columna Derecha: Trazabilidad de Estados (5 cols) -->
        <div class="lg:col-span-5">
          <div class="sticky top-24 rounded-3xl bg-surface-container-lowest p-6 border border-outline-variant/40 shadow-xs space-y-5">
            <div class="pb-3 border-b border-outline-variant/30">
              <div class="flex items-center gap-2 text-primary">
                <span class="material-symbols-outlined text-2xl">policy</span>
                <h3 class="font-title-lg font-bold text-on-surface text-base sm:text-lg">
                  Trazabilidad de Estados
                </h3>
              </div>
              <span class="text-[11px] text-outline uppercase tracking-wider block font-semibold mt-0.5">
                Auditoría de cambios de estado (RF-19)
              </span>
            </div>

            @if (selectedCita()) {
              @let c = selectedCita()!;
              <div>
                <div class="p-3 rounded-2xl bg-surface-container-low mb-4 text-xs">
                  <span class="text-outline block text-[10px] uppercase font-bold">Cita en auditoría:</span>
                  <span class="font-bold text-on-surface text-sm block">{{ c.codigo }} · {{ c.especialidad }}</span>
                  <span class="text-on-surface-variant">{{ c.profesionalNombre }}</span>
                </div>

                @if (selectedCitaHistoryLoading()) {
                  <p class="text-xs text-outline">Cargando historial...</p>
                } @else if (selectedCitaHistory().length === 0) {
                  <p class="text-xs text-outline">Sin eventos de auditoría registrados para esta cita.</p>
                } @else {
                  <div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40">
                    @for (evento of selectedCitaHistory(); track $index) {
                      <div class="relative">
                        <span
                          class="absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-surface-container-lowest flex items-center justify-center text-[10px] font-bold"
                          [class]="$last ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'"
                        >
                          {{ $index + 1 }}
                        </span>
                        <div>
                          <div class="flex items-center justify-between">
                            <span class="font-bold text-xs text-on-surface">Estado: {{ evento.estado }}</span>
                            <span class="text-[10px] text-outline font-medium">{{ evento.fechaHora }}</span>
                          </div>
                          <p class="text-[11px] text-on-surface-variant mt-1 leading-snug"><strong>Fuente:</strong> {{ evento.fuente }}</p>
                          @if (evento.descripcion) {
                            <p class="text-[11px] text-error mt-1 bg-error-container/20 p-2 rounded-lg border border-error/20">
                              {{ evento.descripcion }}
                            </p>
                          }
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            } @else {
              <div class="py-8 text-center text-xs text-outline">
                Seleccione una cita de la lista para visualizar su bitácora de eventos.
              </div>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Reprogramación con disponibilidad real -->
    @if (rescheduleCita()) {
      @let c = rescheduleCita()!;
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
        <div class="w-full max-w-2xl bg-surface-container-lowest rounded-3xl p-6 sm:p-7 shadow-2xl border border-outline-variant/40 space-y-5">
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <div class="flex items-center gap-2.5">
              <span class="material-symbols-outlined text-primary text-2xl">event_repeat</span>
              <h3 class="font-title-lg font-bold text-on-surface text-base sm:text-lg">
                Solicitud de Reprogramación
              </h3>
            </div>
            <button
              type="button"
              (click)="rescheduleCita.set(null)"
              class="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant"
            >
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/40 space-y-2 text-xs">
            <span class="text-[10px] font-bold uppercase tracking-wider text-outline block">Cita Actual Asignada</span>
            <p class="font-bold text-on-surface text-sm">{{ c.especialidad }}</p>
            <p class="text-on-surface-variant">{{ c.profesionalNombre }}</p>
            <p class="text-primary font-bold">{{ c.fechaTexto }} · {{ c.hora }}</p>
            <p class="text-outline">{{ c.sede }}</p>
          </div>

          <div class="space-y-3 text-xs">
            <div class="flex items-end gap-2">
              <div class="flex-1">
                <label for="input-resched-date" class="block font-semibold text-on-surface mb-1">Nueva fecha a consultar</label>
                <input
                  type="date"
                  id="input-resched-date"
                  #reschedDate
                  class="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs"
                />
              </div>
              <button
                type="button"
                (click)="searchRescheduleAvailability(reschedDate.value)"
                class="px-3.5 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
              >
                Buscar franjas
              </button>
            </div>

            @if (rescheduleSearching()) {
              <p class="text-outline">Consultando disponibilidad...</p>
            } @else if (rescheduleOptions().length > 0) {
              <div>
                <label for="select-resched-option" class="block font-semibold text-on-surface mb-1">Franja disponible</label>
                <select
                  id="select-resched-option"
                  (change)="selectRescheduleOption($any($event.target).value)"
                  class="w-full px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs"
                >
                  <option value="">Seleccione una franja...</option>
                  @for (option of rescheduleOptions(); track option.id) {
                    <option [value]="option.id">{{ formatOptionTime(option) }}</option>
                  }
                </select>
              </div>
            } @else if (rescheduleSearched()) {
              <p class="text-outline">No hay franjas disponibles para esa fecha con el mismo profesional.</p>
            }

            <div>
              <label for="textarea-resched-reason" class="block font-semibold text-on-surface mb-1">Motivo de la solicitud</label>
              <textarea
                id="textarea-resched-reason"
                #reschedReason
                rows="2"
                class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs"
                placeholder="Describa el motivo por el cual no puede asistir en la fecha actual..."
              ></textarea>
            </div>
          </div>

          <div class="p-3 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 text-xs">
            Su cita actual conservará su validez y cupo hasta que el despacho administrativo evalúe y concilie la nueva franja solicitada.
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/30">
            <button
              type="button"
              (click)="rescheduleCita.set(null)"
              class="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              [disabled]="!selectedRescheduleOption()"
              (click)="confirmReschedule(reschedReason.value)"
              class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Radicar Solicitud de Reprogramación
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Modal Cancelar Cita -->
    @if (cancelCita()) {
      @let c = cancelCita()!;
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
        <div class="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
          <div class="flex items-center gap-3 text-error">
            <span class="material-symbols-outlined text-3xl">cancel</span>
            <h3 class="font-title-lg font-bold text-on-surface">Liberar Cupo Asistencial</h3>
          </div>

          <p class="text-xs text-on-surface-variant leading-relaxed">
            ¿Confirma que desea cancelar su cita de <strong>{{ c.especialidad }}</strong> del día <strong>{{ c.fechaTexto }}</strong>?
            El sistema liberará el horario de forma inmediata.
          </p>

          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              (click)="cancelCita.set(null)"
              class="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high"
            >
              No, mantener cita
            </button>
            <button
              type="button"
              (click)="confirmCancel()"
              class="px-4 py-2 rounded-xl bg-error text-on-error text-xs font-semibold hover:bg-error/90 shadow-xs"
            >
              Sí, cancelar cita
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class MisCitasPage {
  readonly fcvService = inject(FcvDataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly selectedStatusFilter = signal<string>('todas');
  readonly selectedCita = signal<Cita | null>(null);
  readonly selectedCitaHistory = signal<AuditEvent[]>([]);
  readonly selectedCitaHistoryLoading = signal(false);

  readonly rescheduleCita = signal<Cita | null>(null);
  readonly rescheduleSearching = signal(false);
  readonly rescheduleSearched = signal(false);
  readonly rescheduleOptions = signal<AvailabilityOption[]>([]);
  readonly selectedRescheduleOption = signal<AvailabilityOption | null>(null);
  readonly cancelCita = signal<Cita | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.fcvService.loadCatalogSpecialties().subscribe();
      this.fcvService.loadCatalogLocations().subscribe();
      this.fcvService.loadCatalogProfessionals().subscribe();
      this.fcvService.loadMyAppointments({}).subscribe({
        error: () => this.fcvService.showToast('Modo local', 'No se pudo cargar sus citas desde la API.', 'cloud_off', 'info'),
      });
    }
  }

  activeCount() {
    return this.fcvService.myCitas().filter((c) => c.estado === 'Confirmada' || c.estado === 'Pendiente de aprobación').length;
  }

  historyCount() {
    return this.fcvService.myCitas().filter((c) => c.estado === 'Realizada' || c.estado === 'Rechazada' || c.estado === 'Cancelada').length;
  }

  countByStatus(status: AppointmentStatus) {
    return this.fcvService.myCitas().filter((c) => c.estado === status).length;
  }

  filteredCitas() {
    if (this.selectedStatusFilter() === 'todas') {
      return this.fcvService.myCitas();
    }
    return this.fcvService.myCitas().filter((c) => c.estado === this.selectedStatusFilter());
  }

  getStatusBadgeClass(status: AppointmentStatus) {
    switch (status) {
      case 'Confirmada':
        return 'bg-emerald-100 text-emerald-800';
      case 'Pendiente de aprobación':
        return 'bg-amber-100 text-amber-800';
      case 'Rechazada':
        return 'bg-error-container text-on-error-container';
      case 'Realizada':
        return 'bg-primary-fixed text-on-primary-fixed';
      case 'Cancelada':
        return 'bg-surface-container-high text-outline';
      default:
        return 'bg-surface-container text-on-surface';
    }
  }

  selectCita(cita: Cita) {
    this.selectedCita.set(cita);
    this.selectedCitaHistory.set([]);
    if (!cita.appointmentId) return;
    this.selectedCitaHistoryLoading.set(true);
    this.fcvService.loadMyAppointmentHistory(cita.appointmentId).subscribe({
      next: (events) => {
        this.selectedCitaHistory.set(events);
        this.selectedCitaHistoryLoading.set(false);
      },
      error: () => this.selectedCitaHistoryLoading.set(false),
    });
  }

  openRescheduleModal(c: Cita) {
    this.rescheduleCita.set(c);
    this.rescheduleSearched.set(false);
    this.rescheduleOptions.set([]);
    this.selectedRescheduleOption.set(null);
  }

  searchRescheduleAvailability(date: string) {
    const c = this.rescheduleCita();
    if (!c?.professionalId || !c.specialtyId || !date) return;
    this.rescheduleSearching.set(true);
    this.fcvService.loadAvailability({ date, professionalId: c.professionalId, specialtyId: c.specialtyId }).subscribe({
      next: () => {
        this.rescheduleOptions.set(this.fcvService.apiAvailability());
        this.rescheduleSearching.set(false);
        this.rescheduleSearched.set(true);
      },
      error: () => {
        this.rescheduleSearching.set(false);
        this.rescheduleSearched.set(true);
        this.rescheduleOptions.set([]);
      },
    });
  }

  selectRescheduleOption(optionId: string) {
    this.selectedRescheduleOption.set(this.rescheduleOptions().find((o) => o.id === optionId) ?? null);
  }

  formatOptionTime(option: AvailabilityOption) {
    const start = option.startAt.slice(11, 16);
    const end = option.endAt.slice(11, 16);
    return `${option.startAt.slice(0, 10)} · ${start} - ${end}`;
  }

  confirmReschedule(reason: string) {
    const c = this.rescheduleCita();
    const option = this.selectedRescheduleOption();
    if (!c?.appointmentId || !option) return;

    this.fcvService.solicitarReprogramacion(c.appointmentId, option.slotIds, reason);
    this.rescheduleCita.set(null);
  }

  openCancelModal(c: Cita) {
    this.cancelCita.set(c);
  }

  confirmCancel() {
    const c = this.cancelCita();
    if (!c?.appointmentId) return;

    this.fcvService.cancelarCita(c.appointmentId);
    this.cancelCita.set(null);
  }
}
