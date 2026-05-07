export function getRoleLabel(role) {
    const labels = {
        admin: "Администратор",
        management: "Руководство",
        purchase_manager: "Менеджер по закупкам",
        sales_manager: "Менеджер по продажам",
        warehouse_keeper: "Кладовщик",
        accountant: "Бухгалтер",
        customer: "Клиент"
    };
    return labels[role] ?? "Неизвестная роль";
}