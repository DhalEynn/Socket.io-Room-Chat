import { Component } from '@angular/core';
import { NavController} from 'ionic-angular';
import { Socket } from 'ng-socket-io';

@Component({
  selector: 'page-active-users',
  templateUrl: 'active-users.html',
})
export class ActiveUsersPage {

  public online_users : any;
  public offline_users : any;

  constructor(public navCtrl: NavController, public socket: Socket) {
    this.socket.emit('update user list');
    this.socket.on('updated list of user', (online_users, offline_users) => {
      console.log(online_users);
      console.log(offline_users);
      this.online_users = online_users;
      this.offline_users = offline_users;
    });
  }

  ionViewWillEnter() {
    console.log('ionViewDidLoad ActiveUsersPage');
  }

}


// export class ChooseRoomPage {
//     mySearchBar:string="";
//     constructor(public navCtrl: NavController, public socket: Socket, public roomsProvider: RoomsProvider) {
//     }

//     roomSelected(room) {
//         this.navCtrl.pop().then(() => {
//             this.socket.emit('connect room', room);
//         });
//     }

//     createRoom() {
//       this.navCtrl.push(CreateRoomPage);

//     }

//     onSearchBarInput() {
//         this.roomsProvider.searchWord = this.mySearchBar;
//     }

// }
