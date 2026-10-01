import { ChangeDetectionStrategy, Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FcvDataService } from '../../../services/fcv-data.service';
import { EpsAdmin } from '../../../models/fcv.models';

@Component({
  selector: 'app-eps-catalogos',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    <div class="space-y-6">
      <!-- Breadcrumb y Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <nav class="flex items-center gap-1.5 text-xs text-outline mb-1" aria-label="Ruta de navegación">
            <span>Administración Clínica</span>
            <span class="material-symbols-outlined text-xs">chevron_right</span>
            <span class="text-on-surface font-semibold">EPS y Planes</span>
          </nav>
          <h1 class="font-headline-md text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
            Catálogo de EPS y Planes (HU-023)
          </h1>
          <p class="text-xs text-on-surface-variant mt-1">
            CRUD de aseguradoras y planes sin borrado físico; desactivar una EPS retira sus planes del registro y del catálogo público.
          </p>
        </div>

        <button
          type="button"
          (click)="showCreateEpsModal.set(true)"
          class="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span class="material-symbols-outlined text-base">add_business</span>
          <span>+ Nueva EPS</span>
        </button>
      </div>

      <!-- Listado de EPS -->
      <div class="space-y-4">
        @for (eps of fcvService.epsAdminList(); track eps.id) {
          <div class="rounded-3xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs p-5 space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              @if (editingEpsId() === eps.id) {
                <div class="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    #epsNameInput
                    [value]="eps.name"
                    class="flex-1 px-3 py-1.5 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm"
                  />
                  <button type="button" (click)="saveEpsName(eps.id, epsNameInput.value)" class="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold">Guardar</button>
                  <button type="button" (click)="editingEpsId.set(null)" class="px-3 py-1.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface">Cancelar</button>
                </div>
              } @else {
                <div class="flex items-center gap-2">
                  <span class="font-mono text-primary font-bold text-xs">{{ eps.code }}</span>
                  <h3 class="font-title-md font-bold text-on-surface text-base">{{ eps.name }}</h3>
                  <button type="button" (click)="editingEpsId.set(eps.id)" class="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant" aria-label="Editar nombre de EPS">
                    <span class="material-symbols-outlined text-base">edit</span>
                  </button>
                </div>
              }

              <div class="flex items-center gap-2">
                <span
                  class="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  [class]="eps.active ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-outline'"
                >
                  {{ eps.active ? 'Activa' : 'Inactiva' }}
                </span>
                <button
                  type="button"
                  (click)="toggleEpsActive(eps)"
                  class="px-2.5 py-1 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  {{ eps.active ? 'Desactivar' : 'Activar' }}
                </button>
              </div>
            </div>

            <!-- Planes de la EPS -->
            <div class="pl-2 border-l-2 border-outline-variant/30 space-y-2">
              @for (plan of eps.plans; track plan.id) {
                <div class="flex items-center justify-between p-2.5 rounded-xl bg-surface-container-low text-xs">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-outline">{{ plan.code }}</span>
                    <span class="font-semibold text-on-surface">{{ plan.name }}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span
                      class="px-2 py-0.5 rounded-full text-[11px] font-bold"
                      [class]="plan.active ? 'bg-emerald-100 text-emerald-800' : 'bg-surface-container-high text-outline'"
                    >
                      {{ plan.active ? 'Activo' : 'Inactivo' }}
                    </span>
                    <button
                      type="button"
                      (click)="togglePlanActive(plan.id, !plan.active)"
                      class="px-2 py-0.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 text-[11px] font-semibold text-on-surface hover:bg-surface-container-high"
                    >
                      {{ plan.active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-[11px] text-outline">Esta EPS aún no tiene planes registrados.</p>
              }

              <!-- Formulario para agregar plan -->
              <div class="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  #planCodeInput
                  placeholder="Código (ej: PLAN_NUEVO)"
                  class="w-32 px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs"
                />
                <input
                  type="text"
                  #planNameInput
                  placeholder="Nombre del plan"
                  class="flex-1 px-2.5 py-1.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl text-xs"
                />
                <button
                  type="button"
                  (click)="addPlan(eps.id, planCodeInput.value, planNameInput.value); planCodeInput.value=''; planNameInput.value=''"
                  class="px-3 py-1.5 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high whitespace-nowrap"
                >
                  + Agregar plan
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/40 text-center text-xs text-outline">
            No hay EPS registradas todavía.
          </div>
        }
      </div>
    </div>

    <!-- Modal Nueva EPS -->
    @if (showCreateEpsModal()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/50 backdrop-blur-xs">
        <div class="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 shadow-2xl border border-outline-variant/40 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/30">
            <h3 class="font-title-lg font-bold text-on-surface">Nueva EPS</h3>
            <button type="button" (click)="showCreateEpsModal.set(false)" class="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div>
              <label for="input-eps-code" class="block font-semibold text-on-surface mb-1">Código</label>
              <input type="text" id="input-eps-code" #epsCode placeholder="EPS_NUEVA" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs" />
            </div>
            <div>
              <label for="input-eps-name" class="block font-semibold text-on-surface mb-1">Nombre</label>
              <input type="text" id="input-eps-name" #epsName placeholder="EPS Nueva" class="w-full px-3 py-2 bg-surface-container-low border border-outline-variant/60 rounded-xl text-xs" />
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/30">
            <button type="button" (click)="showCreateEpsModal.set(false)" class="px-4 py-2 rounded-xl bg-surface-container text-xs font-semibold text-on-surface hover:bg-surface-container-high">Cancelar</button>
            <button type="button" (click)="createEps(epsCode.value, epsName.value)" class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs">Guardar EPS</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class EpsCatalogosPage {
  readonly fcvService = inject(FcvDataService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly showCreateEpsModal = signal(false);
  readonly editingEpsId = signal<number | null>(null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.reload();
    }
  }

  private reload() {
    this.fcvService.loadEps().subscribe({
      error: () => this.fcvService.showToast('No se pudo cargar', 'La API rechazó el catálogo de EPS.', 'error', 'error'),
    });
  }

  createEps(code: string, name: string) {
    if (!code || !name) {
      this.fcvService.showToast('Campos requeridos', 'Ingrese código y nombre de la EPS.', 'error', 'error');
      return;
    }
    this.fcvService.createEps(code, name).subscribe({
      next: () => {
        this.showCreateEpsModal.set(false);
        this.reload();
        this.fcvService.showToast('EPS creada', `${name} fue registrada.`, 'check_circle');
      },
      error: () => this.fcvService.showToast('No se pudo crear', 'La API rechazó la EPS (código duplicado).', 'error', 'error'),
    });
  }

  saveEpsName(id: number, name: string) {
    if (!name) return;
    this.fcvService.updateEps(id, name).subscribe({
      next: () => {
        this.editingEpsId.set(null);
        this.reload();
        this.fcvService.showToast('EPS actualizada', 'El nombre se actualizó en la EPS y sus planes.', 'check_circle');
      },
      error: () => this.fcvService.showToast('No se pudo actualizar', 'La API rechazó el cambio.', 'error', 'error'),
    });
  }

  toggleEpsActive(eps: EpsAdmin) {
    this.fcvService.changeEpsStatus(eps.id, !eps.active).subscribe({
      next: () => {
        this.reload();
        this.fcvService.showToast('Estado actualizado', `${eps.name} ahora está ${!eps.active ? 'activa' : 'inactiva'}.`, 'tune');
      },
      error: () => this.fcvService.showToast('No se pudo actualizar', 'La API rechazó el cambio de estado.', 'error', 'error'),
    });
  }

  addPlan(epsId: number, code: string, name: string) {
    if (!code || !name) {
      this.fcvService.showToast('Campos requeridos', 'Ingrese código y nombre del plan.', 'error', 'error');
      return;
    }
    this.fcvService.createEpsPlan(epsId, code, name).subscribe({
      next: () => {
        this.reload();
        this.fcvService.showToast('Plan creado', `${name} fue agregado.`, 'check_circle');
      },
      error: () => this.fcvService.showToast('No se pudo crear', 'La API rechazó el plan (código duplicado).', 'error', 'error'),
    });
  }

  togglePlanActive(planId: number, active: boolean) {
    this.fcvService.changeEpsPlanStatus(planId, active).subscribe({
      next: () => {
        this.reload();
        this.fcvService.showToast('Estado actualizado', `Plan ahora está ${active ? 'activo' : 'inactivo'}.`, 'tune');
      },
      error: () => this.fcvService.showToast('No se pudo actualizar', 'La API rechazó el cambio de estado.', 'error', 'error'),
    });
  }
}
