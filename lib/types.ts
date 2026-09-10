export type Lesson = { id:string; title:string; minutes:number; content:string[]; keyPoint?:string };
export type Module = { id:string; title:string; lessons:Lesson[] };
export type Course = {
  id:string; slug:string; title:string; category:string; shortDescription:string; description:string;
  price:number; durationHours:number; level:string; rating:number; students:number; featured:boolean;
  gradient:string; image?:string; instructor:{name:string; role:string; bio:string}; outcomes:string[]; modules:Module[];
};
export type Certificate = { code:string; student:string; courseSlug:string; course:string; hours:number; date:string; status:string };
export type Student = { id:string; name:string; email:string; courses:number; progress:number; certificates:number; registeredAt:string };
export type Sale = { id:string; student:string; course:string; value:number; method:string; date:string; status:string };
export type ExamQuestion = { id:string; text:string; options:string[]; correct:number };
export type Exam = { courseSlug:string; title:string; passingScore:number; questions:ExamQuestion[] };
