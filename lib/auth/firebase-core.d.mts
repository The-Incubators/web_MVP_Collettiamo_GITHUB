import type { Auth, User } from 'firebase/auth';
export function createFirebaseAuthCore(options: {
 sdk: Pick<typeof import('firebase/auth'), 'onAuthStateChanged'|'signInAnonymously'|'sendSignInLinkToEmail'|'isSignInWithEmailLink'|'signInWithEmailLink'|'GoogleAuthProvider'|'signInWithPopup'|'signInWithRedirect'|'getRedirectResult'|'signOut'>;
 auth: Auth; origin: string; read:(key:string)=>string|null; write:(key:string,value:string|null)=>void;
}): {
 observe:(cb:(user:User|null)=>void)=>()=>void;
 current:()=>Promise<User|null>; identity:()=>Promise<User>;
 sendEmail:(email:string,name?:string,returnPath?:string)=>Promise<{accessoImmediato:boolean}>;
 isEmailLink:(url:string)=>boolean; completeEmail:(url:string,email?:string)=>Promise<User|null>;
 google:(name?:string)=>Promise<{user?:User;cancelled?:boolean;redirecting?:boolean}>;
 redirect:()=>Promise<User|null>; signOut:()=>Promise<void>; token:()=>Promise<string|null>;
};
