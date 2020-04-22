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
  public big_poster : any;
  public connected_users : any;

  constructor(public navCtrl: NavController, public socket: Socket) {
    this.socket.emit('update user list');
    this.socket.on('updated list of user', (online_users, offline_users) => {
      this.online_users = online_users;
      this.offline_users = offline_users;
    });

    this.socket.emit('need big poster');
    this.socket.on('updated big poster', big_poster => {
        this.big_poster = big_poster;
    });

    this.socket.emit('update connected users');
    this.socket.on('updated connected users', numUsers => {
        this.connected_users = numUsers;
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
