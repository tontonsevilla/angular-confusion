import { Component, OnInit, Input, ViewChild, Inject } from '@angular/core';
import { Dish } from '../shared/dish';
import { DishService } from '../services/dish.service';
import { switchMap } from 'rxjs/operators';
import { Params, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Comment } from '../shared/comment';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-dishdetail',
  templateUrl: './dishdetail.component.html',
  styleUrls: ['./dishdetail.component.scss'],
  animations: [
    trigger('visibility', [
        state('shown', style({
            transform: 'scale(1.0)',
            opacity: 1
        })),
        state('hidden', style({
            transform: 'scale(0.5)',
            opacity: 0
        })),
        transition('* => *', animate('0.5s ease-in-out'))
    ])
  ]
})
export class DishdetailComponent implements OnInit {

  dish: Dish;

  dishIds: string[];
  prev: string;
  next: string;

  @ViewChild('commentform', null) commentFormDirective;

  commentForm: FormGroup;
  comment: Comment;

  commentFormErrors = {
    'comment': '',
    'author': ''
  };

  commentValidationMessages = {
    'comment': {
      'required':      'Comment is required.',
      'minlength':     'Comment must be at least 2 characters long.'
    },
    'author': {
      'required':      'Author is required.',
      'minlength':     'Author must be at least 2 characters long.'
    }
  };

  errMess: string;

  dishcopy: Dish;

  visibility = 'shown';

  constructor(
    private dishService: DishService,
    private route: ActivatedRoute,
    private location: Location,
    private fb: FormBuilder,
    @Inject('BaseURL') private BaseURL
  ) {
    this.createCommentForm();
  }

  ngOnInit() {
    this.dishService.getDishIds()
      .subscribe(dishIds => this.dishIds = dishIds, errmess => this.errMess = errmess as any);

    this.route.params.pipe(
      switchMap((params: Params) => {
        this.visibility = 'hidden'; return this.dishService.getDish(+params.id); 
      }))
      .subscribe(dish => { this.dish = dish; this.dishcopy = dish; this.setPrevNext(dish.id); this.visibility = 'shown'; },
        errmess => this.errMess = errmess as any);
  }

  setPrevNext(dishId: string) {
    const index = this.dishIds.indexOf(dishId);
    this.prev = this.dishIds[(this.dishIds.length + index - 1) % this.dishIds.length];
    this.next = this.dishIds[(this.dishIds.length + index + 1) % this.dishIds.length];
  }

  goBack(): void {
    this.location.back();
  }

  createCommentForm(): void {
    this.commentForm = this.fb.group({
      rating: 5,
      comment: ['', [Validators.required, Validators.minLength(2)] ],
      author: ['', [Validators.required, Validators.minLength(2)] ]
    });

    this.commentForm.valueChanges
      .subscribe(data => this.onValueChanged(data));

    this.onValueChanged(); // (re)set validation messages now
  }

  onValueChanged(data?: any) {
    if (!this.commentForm) { return; }
    const form = this.commentForm;
    for (const field in this.commentFormErrors) {
      if (this.commentFormErrors.hasOwnProperty(field)) {
        // clear previous error message (if any)
        this.commentFormErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.commentValidationMessages[field];
          for (const key in control.errors) {
            if (control.errors.hasOwnProperty(key)) {
              this.commentFormErrors[field] += messages[key] + ' ';
            }
          }
        }
      }
    }
  }

  onSubmit() {
    this.comment = this.commentForm.value;
    this.comment.date = new Date().toISOString();
    console.log(this.comment);

    this.dishcopy.comments.push(this.comment);
    this.dishService.putDish(this.dishcopy)
      .subscribe(dish => {
        this.dish = dish; this.dishcopy = dish;
      },
      errmess => { this.dish = null; this.dishcopy = null; this.errMess = errmess as any; });

    this.formReset();
  }

  private formReset(): void {
    this.commentForm.reset({
      rating: '',
      comment: '',
      author: ''
    });
    this.commentFormDirective.resetForm();
    this.commentForm.get('rating').setValue(5);
  }

}
