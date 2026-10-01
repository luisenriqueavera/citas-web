import { ChangeDetectionStrategy, Component, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FcvDataService } from '../../../services/fcv-data.service';
import { Cita } from '../../../models/fcv.models';

@Component({
  selector: 'app-mi-agenda',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb y Encabezado -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <nav class="flex items-center gap-1.5 text-xs text-outline mb-1" aria-label="Ruta de navegación">
            <span>Portal Profesional</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="text-on-surface font-semibold">Mi Agenda</span>
          </nav>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="font-headline-md text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
              Mi Agenda Asistencial
            </h1>
            <span class="px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold">
              Hoy: {{ todayLabel }}
            </span>
          </div>
          <p class="text-xs text-on-surface-variant mt-1">
            Gestión en tiempo real de consultas ambulatorias, control de asistencia y publicación de franjas horarias.
          </p>
        </div>

        <div class="flex items-center gap-1.5 text-xs">
          <span class="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-bold">
            {{ atendidasCount() }} Atendidas
          </span>
          <span class="px-2.5 py-1 rounded-xl bg-surface-container-high text-on-surface font-semibold">
            {{ pendientesCount() }} Por atender
          </span>
        </div>
      </div>

      <!-- Layout Principal en Dos Columnas -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Columna Izquierda: Turnos del día (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="rounded-3xl bg-surface-container-lowest p-6 border border-outline-variant/40 shadow-xs">
            <div class="flex items-center gap-2.5 pb-4 border-b border-outline-variant/30 mb-5">
              <div class="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-bold">
                <span class="material-symbols-outlined text-xl">view_timeline</span>
              </div>
              <div>
                <h3 class="font-title-lg font-bold text-on-surface text-base sm:text-lg">
                  Agenda del día
                </h3>
                <span class="text-xs text-on-surface-variant font-medium">
                  Citas aprobadas, ordenadas por hora
                </span>
              </div>
            </div>

            <div class="space-y-4">
              @for (turno of fcvService.apiAgenda(); track turno.id) {
                <div class="rounded-2xl p-4 sm:p-5 bg-surface-container-low border border-outline-variant/40 space-y-3">
                  <div class="flex items-center justify-between gap-2 flex-wrap">
                    <span class="font-mono font-bold text-sm text-primary px-2.5 py-1 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
                      {{ turno.hora }}
                    </span>
                    <span
                      class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                      [class]="turno.estado === 'Realizada'
                        ? 'bg-emerald-100 text-emerald-800'
                        : turno.estado === 'No asistió'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-amber-100 text-amber-900'"
                    >
                      {{ turno.estado }}
                    </span>
                  </div>

                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="font-title-md font-bold text-on-surface text-base">{{ turno.pacienteNombre }}</h4>
                      <p class="text-xs text-on-surface-variant">{{ turno.especialidad }}</p>
                    </div>
                    <div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                      {{ turno.pacienteAvatar }}
                    </div>
                  </div>

                  @if (turno.estado === 'Confirmada') {
                    <div class="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2 flex-wrap">
                      <button
                        type="button"
                        (click)="marcarAsistencia(turno, 'inasistencia')"
                        class="px-3.5 py-1.5 rounded-xl bg-surface-container-lowest text-error hover:bg-error-container border border-error/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-base">person_off</span>
                        <span>Marcar inasistencia</span>
                      </button>
                      <button
                        type="button"
                        (click)="marcarAsistencia(turno, 'realizada')"
                        class="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <span class="material-symbols-outlined text-base">check_circle</span>
                        <span>Marcar como realizada</span>
                      </button>
                    </div>
                  }
                </div>
              } @empty {
                <div class="p-6 rounded-2xl bg-surface-container-low text-center text-xs text-outline">
                  No tiene citas aprobadas para la fecha consultada.
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Columna Derecha: Gestión de Disponibilidad Rápida (5 cols) -->
        <div class="lg:col-span-5 space-y-5">
          <div class="rounded-3xl bg-surface-container-lowest p-6 border border-outline-variant/40 shadow-xs space-y-4">
            <div class="pb-3 border-b border-outline-variant/30">
              <div class="flex items-center gap-2 text-primary">
                <span class="material-symbols-outlined text-2xl">more_time</span>
                <h3 class="font-title-lg font-bold text-on-surface text-base sm:text-lg">
                  Gestión Rápida de Disponibilidad
                </h3>
              </div>
              <span class="text-xs text-on-surface-variant font-medium mt-0.5 block">
                Publicar nuevos bloques de atención médica
              </span>
            </div>

            <div class="space-y-3.5 text-xs">
              <div>
                <label for="input-prof-fecha" class="block font-semibold text-on-surface mb-1">Fecha de atención</label>
                <input
                  type="date"
                  id="input-prof-fecha"
                  #availDate
                  class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs"
                />
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label for="input-prof-hora-inicio" class="block font-semibold text-on-surface mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    id="input-prof-hora-inicio"
                    #availStart
                    value="08:00"
                    class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label for="input-prof-hora-fin" class="block font-semibold text-on-surface mb-1">Hora Fin</label>
                  <input
                    type="time"
                    id="input-prof-hora-fin"
                    #availEnd
                    value="12:00"
                    class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div class="p-3 rounded-2xl bg-surface-container-low text-[11px] text-on-surface-variant leading-relaxed">
                Los bloques se dividen automáticamente en franjas continuas de <strong>30 minutos</strong>.
              </div>

              <button
                type="button"
                id="btn-publicar-disponibilidad"
                (click)="publicarDisponibilidad(availDate.value, availStart.value, availEnd.value)"
                class="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span class="material-symbols-outlined text-base">event_available</span>
                <span>Publicar Bloque de Horarios</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class MiAgendaPage {
  readonly fcvService = inject(FcvDataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly todayLabel = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.fcvService.loadCatalogSpecialties().subscribe();
      this.fcvService.loadCatalogLocations().subscribe();
      const today = new Date().toISOString().slice(0, 10);
      this.fcvService.loadMyAgenda({ date: today }).subscribe({
        error: () => this.fcvService.showToast('Modo local', 'No se pudo cargar la agenda desde la API.', 'cloud_off', 'info'),
      });
    }
  }

  atendidasCount() {
    return this.fcvService.apiAgenda().filter((t) => t.estado === 'Realizada').length;
  }

  pendientesCount() {
    return this.fcvService.apiAgenda().filter((t) => t.estado === 'Confirmada').length;
  }

  marcarAsistencia(turno: Cita, estado: 'realizada' | 'inasistencia') {
    if (!turno.appointmentId) return;
    this.fcvService.marcarAsistencia(turno.appointmentId, estado);
  }

  publicarDisponibilidad(fecha: string, start: string, end: string) {
    this.fcvService.publicarBloqueHorario({
      fecha,
      horaInicio: start,
      horaFin: end,
      sede: 'Sede Norte Cons. 204',
    });
  }
}
