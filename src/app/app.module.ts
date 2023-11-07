// Angular
import { DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Firebase
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

// Material
import { MatNativeDateModule } from '@angular/material/core';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSelectModule } from '@angular/material/select';

// Our Pipes & Providers
import { BuggyDataService } from './buggy-data.service';
import { BuggyThumbnailPipe } from './buggy-detail/buggy-detail';

// Our UI Pieces
import { MessagesComponent } from './messages/messages.component';
import { BuggyConfigComponent } from './buggy-config/buggy-config.component';
import { TimerComponent } from './timer/timer.component';
import { BuggyDetailComponent } from './buggy-detail/buggy-detail.component';
import { BuggyDialogComponent } from './buggy-dialog/buggy-dialog.component';
import { TimerDetailComponent } from './timer-detail/timer-detail.component';
import { DataViewComponent } from './data-view/data-view.component';
import { BuggyPickerComponent } from './buggy-picker/buggy-picker.component';
import { DataViewEntryComponent } from './data-view-entry/data-view-entry.component';

@NgModule({
  declarations: [
    BuggyThumbnailPipe,

    AppComponent,
    
    MessagesComponent,
    BuggyConfigComponent,
    TimerComponent,
    BuggyDetailComponent,
    BuggyDialogComponent,
    TimerDetailComponent,
    DataViewComponent,
    BuggyPickerComponent,
    DataViewEntryComponent
  ],
  imports: [
    AppRoutingModule,

    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,

    MatNativeDateModule,

    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    MatSelectModule,

    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => getFirestore())
  ],
  providers: [
    BuggyDataService,
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
