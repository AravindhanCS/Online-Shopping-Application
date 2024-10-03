  // Function to handle sign-up form submission
  document.getElementById("signUpForm").addEventListener("submit", async function (e) {
    e.preventDefault();
  
    const fullName = document.getElementById("fullName").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const rePassword = document.getElementById("rePassword").value;
  
    // Validation
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!nameRegex.test(fullName)) {
      alert("Name can only contain alphabets and spaces.");
      return;
    }
  
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      alert("Password must be at least 8 characters long and contain at least one special character.");
      return;
    }
  
    if (password !== rePassword) {
      alert("Passwords do not match.");
      return;
    }

    
    const idToken = await signUpUser(email, password); // This should come from the user's login/signup process
    await sendVerificationEmail(idToken).then(() => {
        alert('A verification email has been sent. Please check your inbox and click the link.');
    
        // Start polling to check verification status
        pollEmailVerification(idToken);
    });
    const newCustomerId = await getAndIncrementCounter(idToken);
    const createdAt = new Date(); // Current timestamp
    saveUserToFirestore(fullName, email, password, newCustomerId, createdAt);
    
    alert("Email verified! Redirecting...");
    window.location.href = "signIn.html"; // Redirect to another page
});

//email/password verificaiton
const apiKey = "AIzaSyCyrkcOrihO-SXsXdwo3g0_75OtXO2vH1w"; // Replace with your actual Firebase API key
const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

async function signUpUser(email, password) {
  const response = await fetch(signUpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true
    })
  });

  const data = await response.json();
  if (response.ok) {
    console.log('User created successfully:', data);
    return data.idToken; // Return the token for further API calls
  } else {
    if (data.error && data.error.message === "EMAIL_EXISTS") {
        console.error("Email is already registered. Redirecting to sign-in page.");
        
        // Show a message to the user
        alert("Already registered. Redirecting to sign-in page...");
        
        // Redirect the user to the sign-in page
        window.location.href = "signIn.html"; // Update with the correct sign-in page URL
      }
      else {
        // Handle other errors (e.g., weak password, network issues)
        console.error("Error during sign-up:", data.error.message);
        alert(`Error during sign-up: ${data.error.message}`);
      }
  }
}

//sending verification email
async function sendVerificationEmail(idToken) {
    const verifyEmailUrl = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${apiKey}`;
    const response = await fetch(verifyEmailUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: "VERIFY_EMAIL",
        idToken: idToken
      })
    });
  
    const data = await response.json();
    if (response.ok) {
      console.log('Verification email sent:', data);
    } else {
      console.error('Error sending verification email:', data.error.message);
    }
  }

   // Function to check if the email is verified
   async function checkEmailVerification(idToken) {
    const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`;
    
    const response = await fetch(lookupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: idToken
      })
    });

    const data = await response.json();
    if (response.ok) {
      const user = data.users[0];
      return user.emailVerified;
    } else {
      console.error("Error checking email verification status:", data.error.message);
      return false;
    }
  }
  
  //waiting unitll user clicks the link in email
  function pollEmailVerification(idToken) {
    const checkInterval = 3000; // Poll every 3 seconds
  
        const intervalId = setInterval(async () => {
      const isVerified = await checkEmailVerification(idToken);
      if (isVerified) {
        clearInterval(intervalId); // Stop polling
  
      }
    }, checkInterval);

    console.log("Exiting the pollEmailVerification");
  }

  //saving name,email,customerId, date in firestore database
  async function saveUserToFirestore(name, email, customerId, createdAt) {
    console.log('inside save function');
    const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/users";
    
    let defaultCreditScore=0;

    const response = await fetch(firestoreUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'// Use the idToken from the sign-up response for authorization
      },
      body: JSON.stringify({
        fields: {
          name: { stringValue: name },
          email: { stringValue: email },
          customer_Id: { integerValue: customerId.toString() },
          creditScore: {integerValue: defaultCreditScore.toString()},
          createdAt: { timestampValue: createdAt.toISOString() }
        }
      })
    });
  
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('sign in success');
    } else {
      console.error('Error saving user to Firestore:', data.error.message);
    }
  }
  

//Generating auto-incremental counter
async function getAndIncrementCounter(idToken) {
  const counterUrl = `https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/counters/customerCounter`;
  
  const response = await fetch(counterUrl);
  const data = await response.json();
  
  let currentCount = 0;
  
  if (response.ok && data.fields && data.fields.count) {
    currentCount = parseInt(data.fields.count.integerValue);
    
    // Increment counter
    const newCount = currentCount + 1;
    
    // Update counter in Firestore
    const updateCounterUrl = `${counterUrl}?updateMask.fieldPaths=count`;
    await fetch(updateCounterUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        fields: {
          count: { integerValue: newCount.toString() }
        }
      })
    });
    
    return newCount;
  } else {
    // Initialize counter if it doesn't exist
    await fetch(counterUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        fields: {
          count: { integerValue: "1" }
        }
      })
    });
    
    return 1;
  }
}
  