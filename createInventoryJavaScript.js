const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents";
const counterUrl = `${firestoreUrl}/counters/productCounter`;
const categoryCounterUrl = `${firestoreUrl}/counters/categoryCounter`;
const productUrl = `${firestoreUrl}/products`;
const categoryUrl = `${firestoreUrl}/category`;
const storageUrl = "https://firebasestorage.googleapis.com/v0/b/online-shopping-2c207.appspot.com/o/";

async function getAndIncrementProductId() {
    try {
        // Fetch the current product counter
        const response = await fetch(counterUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();
        let currentProductId = data.fields.lastProductId.integerValue;

        // Increment the counter
        let newProductId = parseInt(currentProductId) + 1;

        // Update the counter document in Firestore
        const updateResponse = await fetch(counterUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                fields: {
                    lastProductId: { integerValue: newProductId.toString() }
                }
            })
        });

        if (!updateResponse.ok) {
            throw new Error("Failed to update product counter");
        }

        return newProductId; // Return the new incremented ProductID
    } catch (error) {
        console.error('Error fetching/incrementing ProductID:', error);
        return null;
    }
}


async function getAndIncrementCategoryId() {
    try {
        // Fetch the current product counter
        const response = await fetch(categoryCounterUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();
        let currentCategoryId = data.fields.lastCategoryId.integerValue;

        // Increment the counter
        let newCategoryId = parseInt(currentCategoryId) + 1;

        // Update the counter document in Firestore
        const updateResponse = await fetch(categoryCounterUrl, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({
                fields: {
                    lastCategoryId: { integerValue: newCategoryId.toString() }
                }
            })
        });

        if (!updateResponse.ok) {
            throw new Error("Failed to update Category counter");
        }

        return newCategoryId; // Return the new incremented CategoryID
    } catch (error) {
        console.error('Error fetching/incrementing CategoryID:', error);
        return null;
    }
}

async function createCategoryId(category_Name){
    // Fetch the current product counter
    const response = await fetch(categoryUrl, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${idToken}`,
        }
    });

    const data = await response.json();

    for(let i=0;i<data.documents.length;i++){
        let categoryName=data.documents[i].fields.name.stringValue;
        if(category_Name==categoryName){
          return data.documents[i].fields.category_Id.integerValue;
       }
    }

    const category_Id = await getAndIncrementCategoryId();

    const categoryData = {
        fields: {
            category_Id: {integerValue: category_Id},
            name: {stringValue: category_Name},
            isActive: { booleanValue: true },
            createdAt: { timestampValue: new Date().toISOString() }
        }
    };

    const response2 = await fetch(categoryUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // 'Authorization': `Bearer ${sessionStorage.getItem('idToken')}` // Assuming idToken is stored in sessionStorage
        },
        body: JSON.stringify(categoryData)
    });

    return category_Id;
}

async function uploadImage(file, productId) {
    try {

        const storageUrl = `https://firebasestorage.googleapis.com/v0/b/online-shopping-2c207.appspot.com/o?name=${file.name}`;
    
      const response = await fetch(storageUrl, {
            method: 'POST',
            headers: {
                'Content-Type': file.type,
            },
            body: file
        });

        const data = await response.json();

        // Get the image download URL
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/online-shopping-2c207.appspot.com/o/${file.name}?alt=media`;

        return imageUrl;
    } catch (error) {
        console.error('Error uploading image:', error);
        return null;
    }
}
      

document.getElementById('addProductForm').addEventListener('submit', async function(event){

    event.preventDefault();

    const productName = document.getElementById('productName').value;
    const categoryName = document.getElementById('categoryName').value;
    const quantity = document.getElementById('quantity').value;
    const price = document.getElementById('price').value;
    const description = document.getElementById('description').value;
    const availability = document.getElementById('availability').value;
    const isAvailable = availability === 'yes' ? true : false;
    const file = document.getElementById('productImage').files[0];

    const productId = await getAndIncrementProductId();
    const categoryId = await createCategoryId(categoryName.toLowerCase());
    const imageUrl = await uploadImage(file, productId);

    const productData = {
        fields: {
            productId: {integerValue: productId},
            categoryId: {integerValue: categoryId},
            title: { stringValue: productName },
            description: { stringValue: description },
            quantity: { integerValue: quantity.toString() },
            price: { doubleValue: parseFloat(price) },
            imageUrl: { stringValue: imageUrl },
            isAvailable: { booleanValue: isAvailable },
            isActive: { booleanValue: true },
            createdAt: { timestampValue: new Date().toISOString() }
        }
    };

    try {
        const response = await fetch(productUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${sessionStorage.getItem('idToken')}` // Assuming idToken is stored in sessionStorage
            },
            body: JSON.stringify(productData)
        });
        if (response.ok) {
            alert('Product added successfully');
            // Optionally redirect to another page
            location.reload();
        } else {
            alert('Failed to add product');
        }
    } catch (error) {
        console.error('Error adding product:', error);
    }
});

function goHome() {
    window.location.href = 'adminFirstPage.html'; // Redirect to the home page
}
