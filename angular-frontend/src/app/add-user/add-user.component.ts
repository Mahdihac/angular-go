// add-user.component.ts

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../user.service';
import { User } from '../user';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.css']
})
export class AddUserComponent {
  user: User = { name: '', email: '' };

  constructor(private userService: UserService, private router: Router) { }

  onSubmit(): void {
    this.userService.createUser(this.user).subscribe(() => {
      // Redirect to user list after adding user
      this.router.navigate(['/']);
    });
  }
}
