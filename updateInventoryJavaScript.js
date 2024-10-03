const firestoreUrl = "https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents";
const productUrl = `${firestoreUrl}/products`;
const categoryUrl = `${firestoreUrl}/category`;
const categoryCounterUrl = `${firestoreUrl}/counters/categoryCounter`;

// Redirect to Home
function goHome() {
    window.location.href = "adminFirstPage.html"; // Replace with your home page URL
}

let productId;
let productsList = [];

// Function to search for a product by name
async function searchProduct() {
    const searchInput = document.getElementById('productSearchInput').value.trim().toLowerCase();
    const searchResultsContainer = document.getElementById('productGrid');
    searchResultsContainer.innerHTML = '';

    if (!searchInput) {
        alert('Search box is empty');
        return;
    }
          const response = await fetch(productUrl, {
                method: 'GET',
                headers: {
                    // 'Authorization': `Bearer ${idToken}`,
                }
            });
        
            const data = await response.json();
        
            for(let i=0;i<data.documents.length;i++){
                const productName=data.documents[i].fields.title.stringValue.trim().toLowerCase();
                if(searchInput==productName){
                    productId=data.documents[i].fields.productId.integerValue;
                    const productsResponse = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents:runQuery`, {
                        method: 'POST',
                        headers: {
                            // 'Authorization': Bearer YOUR_FIREBASE_AUTH_TOKEN, // Add your token if required
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            structuredQuery: {
                                from: [{ collectionId: "products" }], // Your product collection
                                where: {
                                    compositeFilter: { // Use compositeFilter for multiple conditions
                                        op: "AND", // Combine the filters with "AND"
                                        filters: [
                                            {
                                                fieldFilter: {
                                                    field: { fieldPath: "productId" }, // Field to filter by category ID
                                                    op: "EQUAL",
                                                    value: { integerValue: productId } // Category ID to match
                                                }
                                             },
                                            {
                                                fieldFilter: {
                                                    field: { fieldPath: "isActive" }, // Field to filter by active status
                                                    op: "EQUAL",
                                                    value: { booleanValue: true } // Only fetch active products
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        })
                    });
                    const productsData = await productsResponse.json();
                    productsList.push(productsData[0]);
               }
            }

            for(let i=0;i<productsList.length;i++){
                let inActiveProduct=productsList[i].document;
                if(inActiveProduct==undefined){
                    productsList.splice(i,1);
                }
            }

            if(productsList.length>0){
                const productGrid = document.getElementById("productGrid");
                
                const searchContainer = document.getElementsByClassName('search-container');
                Array.from(searchContainer).forEach(item => {
                    item.style.display = 'none';
                });

                productsList.forEach(product => {
                    const productElement = document.createElement('div');
                    productElement.classList.add('product-card');
                    productElement.innerHTML = `
                        <div id="updateItems">
                        <img src="${product.document.fields.imageUrl.stringValue}" alt="${product.document.fields.title.stringValue}">
                        <div class="product-info">
                            <h3>${product.document.fields.title.stringValue}</h3>
                            <p>${product.document.fields.description.stringValue}</p>
                            <p>Qty: ${product.document.fields.quantity.integerValue}</p>
                            <div class="price">$${product.document.fields.price.doubleValue.toFixed(2)}</div>
                            <button data-product='${JSON.stringify(product)}' onclick="populateUpdateForm(this)">Update</button>
                        </div>
                        </div>
                    `;
                    productGrid.appendChild(productElement);
                });
            }
            else{
                alert("No Such Product Exist!!");
                location.reload();
            }
            
            
}

let oldCategoryName;
let categoryId;

// Populate the update form with the product data
async function populateUpdateForm(button) {
 
    const productItems = document.getElementsByClassName('product-grid');
    Array.from(productItems).forEach(item => {
        item.style.display = 'none';
    });

   
    

    const product = JSON.parse(button.getAttribute('data-product'));
    categoryId = product.document.fields.categoryId.integerValue;

    const categoryResponse = await fetch(categoryUrl, {
        method: 'GET',
        headers: {
            // 'Authorization': `Bearer ${idToken}`,
        }
    });

    const categoryData = await categoryResponse.json();

    let categoryName;
        
            for(let i=0;i<categoryData.documents.length;i++){
                const category_Id=categoryData.documents[i].fields.category_Id.integerValue;
                if(categoryId==category_Id){
                  categoryName=categoryData.documents[i].fields.name.stringValue;
               }
            }

    productId=product.document.fields.productId.integerValue;
    oldCategoryName=categoryName;

    document.getElementById('title').value = product.document.fields.title.stringValue;
    document.getElementById('category').value = categoryName;
    document.getElementById('quantity').value = product.document.fields.quantity.integerValue;
    document.getElementById('price').value = product.document.fields.price.doubleValue;
    document.getElementById('isAvailable').value = product.document.fields.isAvailable.booleanValue.toString();
    document.getElementById('description').value = product.document.fields.description.stringValue;
    
    // Show product image and ask if the user wants to update it
    const imageSection = document.getElementById('imageSection');
    const productImage = document.getElementById('productImage');
    productImage.src = product.document.fields.imageUrl.stringValue;
    imageSection.style.display = 'block';

    document.getElementById('updateFormContainer').style.display = 'block';
}

// Function to update product info

async function updateProduct()
{

    const documentId=await getDocumentIdByProductId(productId);
    
    const productImage = document.getElementById('productImage');
    let imageUrl = productImage.src;
    const newImageFile = imageInput.files[0];

    if(newImageFile){
        const newImageUrl = await uploadImage(newImageFile, productId);
        imageUrl=newImageUrl;
    }

    let newCategoryName = document.getElementById('category').value;

    if(oldCategoryName!=newCategoryName){
        categoryId=await createCategoryId(newCategoryName);
        console.log(categoryId);
        console.log(newCategoryName);
    }

    const productName = document.getElementById('productSearchInput').value;
    const updatedData = {
        title: document.getElementById('title').value,
        categoryId: categoryId,
        quantity: parseInt(document.getElementById('quantity').value, 10),
        price: parseFloat(document.getElementById('price').value),
        isAvailable: document.getElementById('isAvailable').value === 'true',
        description: document.getElementById('description').value,
        imageUrl: imageUrl
    };
    
    try {
        let updateFields = `updateMask.fieldPaths=title&updateMask.fieldPaths=description&updateMask.fieldPaths=price&updateMask.fieldPaths=quantity&updateMask.fieldPaths=isAvailable&updateMask.fieldPaths=imageUrl&updateMask.fieldPaths=categoryId`;
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/online-shopping-2c207/databases/(default)/documents/products/${documentId}?${updateFields}`, {
            method: 'PATCH',  // Use PATCH for partial updates
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fields: {
                    title: { stringValue: updatedData.title },
                    categoryId: {integerValue: updatedData.categoryId},
                    description: { stringValue: updatedData.description },
                    price: { doubleValue: updatedData.price },
                    quantity: { integerValue: updatedData.quantity },
                    isAvailable: { booleanValue: updatedData.isAvailable },
                    imageUrl: { stringValue: updatedData.imageUrl }
                }
            })
        });

        if (response.ok) {
            alert('Product updated successfully.');
            location.reload();
        } else {
            console.error('Error updating product:', response.statusText);
        }
    } catch (error) {
        console.error('Error updating product:', error);
    }
    

}

async function uploadImage(file) {
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

async function getDocumentIdByProductId(productId) {

    try {
        const response = await fetch(productUrl, {
            method: 'GET',
            headers: {
                // 'Authorization': `Bearer ${idToken}`,
            }
        });

        const data = await response.json();

        let documentId;

        for(let i=0;i<data.documents.length;i++){
            const product_Id=data.documents[i].fields.productId.integerValue;
            if(productId==product_Id){
                documentId=data.documents[i].name.split('/').pop();
           }
        }

        return documentId;
    } catch (error) {
        console.error('Error fetching document ID:', error);
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