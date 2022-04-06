class App {
    constructor() {
        this.table = document.getElementById('planningTable');
        this.executorsAPI = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/users';
        this.ticketsAPI = 'https://varankin_dev.elma365.ru/api/extensions/2a38760e-083a-4dd0-aebc-78b570bfd3c7/script/tasks';
        this.init();
    }

    init = () => {
        this.renderExecutors();
        this.renderDateTabs();
        this.renderTickets();
    }

    renderExecutors = () => {
        const tableBody = this.table.getElementsByTagName('tbody')[0];
        const responseAPI = this.api(this.executorsAPI);
        responseAPI.then((executors) => {
            Object.keys(executors).forEach((id) => {
                const executor = executors[id];
                tableBody.innerHTML += `
                    <tr data-executor-id="${executor.id}">
                        <td class="executor">${executor.firstName} ${executor.surname}</td>
                    </tr>
                `;
            });
            this.renderTableRows();
        });
    }

    renderTableRows = () => {
        const tableBody = this.table.getElementsByTagName('tbody')[0];
        const tableHead = this.table.getElementsByTagName('thead')[0];
        const rows = tableBody.querySelectorAll('tr');
        const countDays = this.countTableRows();
        const dateRows = tableHead.querySelectorAll('tr .date');

        let datesCollection = [];

        dateRows.forEach((row) => {
            datesCollection.push(row.innerHTML);
        });

        rows.forEach((row) => {
            for (let i = 0; i < countDays; i++) {
                row.innerHTML += `
                    <td data-executor-id="${row.getAttribute('data-executor-id')}" data-date="${datesCollection[i]}"></td>
                `;
            }
        });
    }

    renderDateTabs = () => {
        const tableHead = this.table.querySelector('thead tr');
        let date = new Date();
        let currentYear = date.getFullYear();
        let currentMonth = date.getMonth();
        let currentDay = date.getDate();
        let dates = this.getDaysInMonth(currentDay, currentMonth, currentYear);
        let datesRow = [
            '<td id="logo">Planner++</td>'
        ];

        dates.forEach((date) => {
            datesRow.push(`
                <td class="date">${date}</td>
            `);
        });

        tableHead.innerHTML = datesRow.join('');
    }

    countTableRows = () => {
        const tableRows = document.querySelectorAll('#planningTable thead tr')[0].cells;
        const firstDay = Number(tableRows[1].innerText.split('.')[0]);
        const lastDay = Number(tableRows[tableRows.length - 1].innerText.split('.')[0]);
        return lastDay - firstDay;
    }

    renderTickets = () => {
        const tableBody = this.table.getElementsByTagName('tbody')[0];
        const backlog = document.getElementById('backlog');
        const responseAPI = this.api(this.ticketsAPI);

        responseAPI.then((tickets) => {
            Object.keys(tickets).forEach((num) => {
                let ticket = tickets[num];
                let creationDate = new Date(ticket.creationDate).toLocaleDateString();

                if (ticket.executor === null) {
                    backlog.innerHTML += `
                        <div class="ticket" data-ticket-id="${ticket.id}">
                            <div class="header">
                                <div class="title">${ticket.subject}</div>
                                <div class="creation-date">${creationDate}</div>
                            </div>
                            <div class="description">
                                ${ticket.description === '' ? 'Без описания' : ticket.description}
                            </div>
                        </div>
                    `;
                }

                if (ticket.executor) {
                    const tableBody = this.table.getElementsByTagName('tbody')[0];
                    let executorTableRow = tableBody.querySelector(`[data-executor-id="${ticket.executor}"]`);
                    let tableCells = executorTableRow.querySelectorAll('td');
                    let datesRange = this.getDateRange(new Date(ticket.planStartDate), new Date(ticket.planEndDate));
console.log(ticket)
                    if (datesRange.length > 0) {
                        datesRange.forEach((date) => {
                            tableCells.forEach((cell) => {
                                let cellDate = cell.getAttribute('data-date');

                                if (cellDate === date) {
                                    console.log(cell)
                                    cell.style.backgroundColor = '#A1D8A2';

                                    if (cell.innerHTML !== '') {
                                        cell.innerHTML += ', ' + ticket.subject;
                                    } else {
                                        cell.innerHTML = ticket.subject;
                                    }
                                    // cell.innerHTML = ticket.subject;
                                }
                            });
                        });
                    }
                }
            });
        });

    }

    api = async (url) => {
        const response = await fetch(url);
        return response.json();
    }

    getDaysInMonth = (day, month, year) => {
        let date = new Date(year, month, day);
        let days = [];
        while (date.getMonth() === month) {
            days.push(new Date(date).toLocaleDateString());
            date.setDate(date.getDate() + 1);
        }
        return days;
    }

    americanDateFormat = (date) => {
        return date.split('.').reverse().join('-');
    }

    getDateRange = (startDate, endDate) => {
        const dates = []
        let currentDate = startDate
        const addDays = function (days) {
            const date = new Date(this.valueOf())
            date.setDate(date.getDate() + days)
            return date
        }
        while (currentDate <= endDate) {
            dates.push(currentDate.toLocaleDateString())
            currentDate = addDays.call(currentDate, 1)
        }
        return dates
    }
}