/** Shared Firebase transport. SDK injection keeps browser and Next on the same real auth path. */
export function createFirebaseAuthCore({sdk, auth, origin, read, write}) {
  const EMAIL='colletta.emailAccesso', NAME='colletta.nomeAccesso', NAME_UID='colletta.nomeAccessoUid';
  return {
    observe: cb => sdk.onAuthStateChanged(auth, cb),
    async current(){await auth.authStateReady();return auth.currentUser;},
    async identity(){await auth.authStateReady();return auth.currentUser || (await sdk.signInAnonymously(auth)).user;},
    async sendEmail(email,name='',returnPath='/accedi') {
      const destination=new URL(returnPath,origin);
      if(!returnPath.startsWith('/')||returnPath.startsWith('//')||destination.origin!==new URL(origin).origin)throw Object.assign(new Error('Invalid return path'),{code:'auth/invalid-continue-uri'});
      const clean=email.trim();write(NAME_UID,null);
      await sdk.sendSignInLinkToEmail(auth,clean,{url:destination.href,handleCodeInApp:true});
      write(EMAIL,clean);write(NAME,name.trim()||null);
      return {accessoImmediato:false};
    },
    isEmailLink: url => sdk.isSignInWithEmailLink(auth,url),
    async completeEmail(url,email){
      if(!sdk.isSignInWithEmailLink(auth,url))return null;
      const address=email||read(EMAIL);
      if(!address)throw Object.assign(new Error('Email required'),{code:'auth/email-required'});
      const expected=read(EMAIL);
      const result=await sdk.signInWithEmailLink(auth,address,url);
      if(expected?.toLowerCase()===address.trim().toLowerCase())write(NAME_UID,result.user.uid);
      else {write(NAME,null);write(NAME_UID,null);}
      write(EMAIL,null);return result.user;
    },
    async google(name='') {
      write(NAME_UID,null);write(NAME,name.trim()||null);
      const provider=new sdk.GoogleAuthProvider();
      try {const result=await sdk.signInWithPopup(auth,provider);write(NAME_UID,result.user.uid);return {user:result.user};}
      catch(error){
        if(['auth/popup-closed-by-user','auth/cancelled-popup-request'].includes(error.code)){write(NAME,null);write(NAME_UID,null);return {cancelled:true};}
        if(['auth/popup-blocked','auth/operation-not-supported-in-this-environment'].includes(error.code)){
          await sdk.signInWithRedirect(auth,provider);return {redirecting:true};
        }
        throw error;
      }
    },
    async redirect(){const user=(await sdk.getRedirectResult(auth))?.user||null;if(user)write(NAME_UID,user.uid);return user;},
    signOut:()=>sdk.signOut(auth),
    async token(){await auth.authStateReady();return (await auth.currentUser?.getIdToken())??null;}
  };
}
