import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ActiveUsersPage } from './active-users';

@NgModule({
  declarations: [
    ActiveUsersPage,
  ],
  imports: [
    IonicPageModule.forChild(ActiveUsersPage),
  ],
})
export class ActiveUsersPageModule {}
