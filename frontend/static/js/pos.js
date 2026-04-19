function calculatePosTotals() {
    const subtotal = currentReceipt.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    let discount = 0;
    if (appliedCustomer) discount = subtotal * (appliedCustomer.percent / 100);
    const total = subtotal - discount;
    const vat = total * 0.2;

    document.getElementById('posSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('posDiscount').textContent = discount.toFixed(2);
    document.getElementById('posVat').textContent = vat.toFixed(2);
    document.getElementById('posTotal').textContent = total.toFixed(2);
    document.getElementById('posPayBtn').disabled = currentReceipt.length === 0;
}

window.changeQty = (index, delta) => {
    const item = currentReceipt[index];
    if (delta > 0 && item.quantity >= item.max_quantity) {
        showBeautifulAlert(`Не можна додати більше. На полиці лише: ${item.max_quantity} шт.`, 'danger');
        return;
    }
    item.quantity += delta;
    if (item.quantity <= 0) currentReceipt.splice(index, 1);
    renderPosTable();
    calculatePosTotals();
};

window.removeFromReceipt = (index) => {
    currentReceipt.splice(index, 1);
    renderPosTable();
    calculatePosTotals();
};