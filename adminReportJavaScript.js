// Disable other dropdowns when one is selected
function disableOthers(selectedDropdownId) {
    const dropdowns = ['customerReportDropdown', 'inventoryReportDropdown', 'salesReportDropdown'];
    
    // Loop through each dropdown
    dropdowns.forEach((id) => {
        if (id !== selectedDropdownId) {
            document.getElementById(id).disabled = true; // Disable other dropdowns
        }
    });
}

// // Enable all dropdowns when the user clicks on one to allow changing the selection
function enableAllDropdowns() {
    const dropdowns = ['customerReportDropdown', 'inventoryReportDropdown', 'salesReportDropdown'];

    // Loop through each dropdown to enable them all
    dropdowns.forEach((id) => {
        document.getElementById(id).disabled = false;
    });
}

// Function to handle report generation
async function generateReport() {
    const customerReport = document.getElementById('customerReportDropdown').value;
    const inventoryReport = document.getElementById('inventoryReportDropdown').value;
    const salesReport = document.getElementById('salesReportDropdown').value;

    console.log(customerReport);
    console,log

    if (customerReport) {
        // Call function to generate customer report
        await customerReport();
    } else if (inventoryReport) {
        // Call function to generate inventory report
        await inventoryReport();
    } else if (salesReport) {
        // Call function to generate sales report
        await salesReport();
    } else {
        alert('Please select a report type before generating.');
    }
}

async function customerReport(){

}