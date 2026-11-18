import { Component, DestroyRef, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/theme.service';

/** Caso de estudio de StoryIn: proyecto personal construido y documentado en público. */
@Component({
  selector: 'app-caso-storyin',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './caso-storyin.component.html',
})
export class CasoStoryinComponent {
  readonly theme = inject(ThemeService);
  private readonly doc = inject(DOCUMENT);

  constructor() {
    this.doc.documentElement.classList.add('limpio');
    inject(DestroyRef).onDestroy(() => this.doc.documentElement.classList.remove('limpio'));
  }
}
