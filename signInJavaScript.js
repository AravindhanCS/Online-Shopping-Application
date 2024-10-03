// Firebase REST API URL and Key
const firebaseApiKey = "AIzaSyCyrkcOrihO-SXsXdwo3g0_75OtXO2vH1w"; // Replace with your Firebase API Key
const loginUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`;
const resetPasswordUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`;

let customerId;

// Login Form Submission
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault(); // Prevent form from reloading the page
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const messageEl = document.getElementById('message');
  messageEl.innerHTML = ''; // Clear previous message
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
        returnSecureToken: true
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
        // Firebase login was successful; now fetch user details from Firestore
        const idToken = data.idToken; // Use this to authenticate Firestore requests
        const userUid = data.localId; // This is the user's unique ID in Firebase
        
        // Firestore REST API URL to get the user data (replace with your project details)
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/users`;
      
        const firestoreResponse = await fetch(firestoreUrl, {
          method: 'GET',
           headers: {
            //  'Authorization': `Bearer ${idToken}` // Use the Firebase auth token for the Firestore request
            'Content-Type': 'application/json'
           }
        });
      
        const userData = await firestoreResponse.json();

        let isAdmin;

        for(let i=0;i<userData.documents.length;i++){
              let databaseEmail=userData.documents[i].fields.email.stringValue;
           
              if(email==databaseEmail){
                if(userData.documents[i].fields?.["isAdmin"] !== undefined){
                    isAdmin=true;
                }
                else{
                  customerId=userData.documents[i].fields.customer_Id.integerValue;
                    isAdmin=false;
                } 
             }
        }
      
    
        if (isAdmin) {
          // If the user is an admin, redirect to the admin page
          window.location.href = 'adminFirstPage.html'; // Admin page
        } else {
          // If not an admin, redirect to the customer page
          // Store data in session storage
         sessionStorage.setItem('customer_Id', customerId);
         window.location.href = 'customerFirstPage.html'; // Customer page
        }
      }
     else {
      // If login fails, show an error message
      if (data.error.message === "EMAIL_NOT_FOUND" || data.error.message === "INVALID_PASSWORD") {
        messageEl.innerHTML = "Email and password don't match. Please try again.";
      } else {
        alert("Error: " + data.error.message);
      }
    }
  } catch (error) {
    alert("An error occurred. Please try again.");
  }
});

// Forgot Password Handling
document.getElementById('forgotPasswordLink').addEventListener('click', function () {
  document.getElementById('forgotPasswordModal').style.display = 'flex'; // Show modal
});

document.querySelector('.close').addEventListener('click', function () {
  document.getElementById('forgotPasswordModal').style.display = 'none'; // Hide modal
});

document.getElementById('resetPasswordBtn').addEventListener('click', async function () {
  const forgotEmail = document.getElementById('forgotEmail').value;
  
    // Firestore REST API URL to get the user data (replace with your project details)
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/users`;
      
    const firestoreResponse = await fetch(firestoreUrl, {
      method: 'GET',
       headers: {
        //  'Authorization': `Bearer ${idToken}` // Use the Firebase auth token for the Firestore request
        'Content-Type': 'application/json'
       }
    });
  
    const userData = await firestoreResponse.json();

    let emailPresentInDatabase;

    for(let i=0;i<userData.documents.length;i++){
          let databaseEmail=userData.documents[i].fields.email.stringValue;
       
          if(forgotEmail==databaseEmail){
            emailPresentInDatabase=true;
         }
    }
    if(emailPresentInDatabase==undefined) emailPresentInDatabase=false;

    if(emailPresentInDatabase){
        try {
            const response = await fetch(resetPasswordUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestType: "PASSWORD_RESET",
                email: forgotEmail
              })
            });
            
            const data = await response.json();
            
            if (response.ok) {
              alert("Password reset link sent to your email.");
              window.location.href = "signIn.html"; // Redirect to forgot password page
            } else {
              alert("Error: " + data.error.message);
            }
          } catch (error) {
            alert("An error occurred. Please try again.");
          }
    }
    else{
        alert("Email is not registered!!");
        window.location.href="signUp.html";
    }
});
