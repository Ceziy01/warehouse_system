import * as XLSX from 'xlsx-js-style';

function autoColWidths(ws) {
  const colWidths = {};
  for (const cellAddr in ws) {
    if (cellAddr[0] === '!') continue;
    const col = XLSX.utils.decode_cell(cellAddr).c;
    const cellValue = ws[cellAddr].v != null ? String(ws[cellAddr].v) : '';
    colWidths[col] = Math.max(colWidths[col] || 0, cellValue.length);
  }
  return Object.keys(colWidths)
    .sort((a, b) => a - b)
    .map(col => ({ wch: Math.min(Math.max(colWidths[col] + 2, 8), 60) }));
}

function applyBorders(ws) {
  const border = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };
  for (const cellAddr in ws) {
    if (cellAddr[0] === '!') continue;
    ws[cellAddr].s = { ...(ws[cellAddr].s || {}), border };
  }
}

export function exportTableToExcel(tableElement, filename = 'export', excludeLastColumn = true) {
  const table = typeof tableElement === 'string'
    ? document.getElementById(tableElement)
    : tableElement;

  if (!table) {
    console.error('Таблица не найдена');
    return;
  }

  const cloneTable = table.cloneNode(true);

  const tbody = cloneTable.querySelector('tbody');
  if (tbody) {
    const bodyRows = tbody.querySelectorAll('tr');
    if (bodyRows.length > 0) {
      bodyRows[bodyRows.length - 1].remove();
    }
  }

  if (excludeLastColumn) {
    const thead = cloneTable.querySelector('thead');
    if (thead) {
      thead.querySelectorAll('tr').forEach(row => row.lastElementChild?.remove());
    }
    if (tbody) {
      tbody.querySelectorAll('tr').forEach(row => row.lastElementChild?.remove());
    }
  }

  const ws = XLSX.utils.table_to_sheet(cloneTable, { raw: true });

  ws['!cols'] = autoColWidths(ws);
  applyBorders(ws);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

  XLSX.writeFile(wb, `${filename}.xlsx`, { cellStyles: true });
}

export function exportOrdersToExcel(orders, filename = 'заказы') {
  const rows = [];

  rows.push([
    'ID заказа', 'ID пользователя', 'Статус', 'Дата создания',
    'Общая сумма', 'ID товара', 'Название товара',
    'Количество', 'Цена на момент заказа', 'Сумма позиции'
  ]);

  orders.forEach(order => {
    order.items.forEach(item => {
      rows.push([
        order.id, order.user_id, order.status,
        new Date(order.created_at).toLocaleString(),
        order.total_price, item.item_id, item.name,
        item.quantity, item.price_at_time,
        item.quantity * item.price_at_time
      ]);
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);

  const colWidths = {};
  for (const cellAddr in ws) {
    if (cellAddr[0] === '!') continue;
    const col = XLSX.utils.decode_cell(cellAddr).c;
    const val = ws[cellAddr].v != null ? String(ws[cellAddr].v) : '';
    colWidths[col] = Math.max(colWidths[col] || 0, val.length);
  }
  ws['!cols'] = Object.keys(colWidths)
    .sort((a, b) => a - b)
    .map(col => ({ wch: Math.min(Math.max(colWidths[col] + 2, 8), 60) }));

  const border = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  };
  for (const cellAddr in ws) {
    if (cellAddr[0] === '!') continue;
    if (!ws[cellAddr].s) ws[cellAddr].s = {};
    ws[cellAddr].s.border = border;
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Заказы');

  const safeFilename = `${filename}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}`;
  XLSX.writeFile(wb, `${safeFilename}.xlsx`, { cellStyles: true });
}