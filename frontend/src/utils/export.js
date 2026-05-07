import * as XLSX from 'xlsx';

export function exportTableToExcel(tableElement, filename = 'export', excludeLastColumn = true) {
  const table = typeof tableElement === 'string' 
    ? document.getElementById(tableElement) 
    : tableElement;

  if (!table) {
    console.error('Таблица не найдена');
    return;
  }

  const cloneTable = table.cloneNode(true);

  if (excludeLastColumn) {

    const thead = cloneTable.querySelector('thead');
    if (thead) {
      const headerRows = thead.querySelectorAll('tr');
      headerRows.forEach(row => {
        const lastCell = row.lastElementChild;
        if (lastCell && (lastCell.tagName === 'TH' || lastCell.tagName === 'TD')) {
          lastCell.remove();
        }
      });
    }


    const tbody = cloneTable.querySelector('tbody');
    if (tbody) {
      const bodyRows = tbody.querySelectorAll('tr');
      bodyRows.forEach(row => {
        const lastCell = row.lastElementChild;
        if (lastCell && (lastCell.tagName === 'TD' || lastCell.tagName === 'TH')) {
          lastCell.remove();
        }
      });
    }
  }

  const ws = XLSX.utils.table_to_sheet(cloneTable, { raw: true });
  
  ws['!cols'] = [{ wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 25 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportOrdersToExcel(orders, filename = 'заказы') {
  const rows = [];
  
  rows.push([
    'ID заказа',
    'ID пользователя',
    'Статус',
    'Дата создания',
    'Общая сумма',
    'ID товара',
    'Название товара',
    'Количество',
    'Цена на момент заказа',
    'Сумма позиции'
  ]);

  orders.forEach(order => {
    order.items.forEach(item => {
      rows.push([
        order.id,
        order.user_id,
        order.status,
        new Date(order.created_at).toLocaleString(),
        order.total_price,
        item.item_id,
        item.name,
        item.quantity,
        item.price_at_time,
        item.quantity * item.price_at_time
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Заказы');
  
  const safeFilename = `${filename}_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}`;
  XLSX.writeFile(wb, `${safeFilename}.xlsx`);
}