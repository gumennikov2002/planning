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
            for (let i = 0; i < countDays + 1; i++) {
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
                        <div class="ticket" data-ticket-id="${ticket.id}" data-ticket-subject="${ticket.subject}" data-ticket-description="${ticket.description}" data-ticket-plan-start-date="${ticket.planStartDate}" data-ticket-plan-end-date="${ticket.planEndDate}" draggable="true">
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

                    if (datesRange.length > 0) {
                        datesRange.forEach((date) => {
                            tableCells.forEach((cell) => {
                                let cellDate = cell.getAttribute('data-date');

                                if (cellDate === date) {
                                    cell.classList.add('active');

                                    if (cell.innerHTML !== '') {
                                        cell.innerHTML += ', ' + ticket.subject;
                                    } else {
                                        cell.innerHTML = ticket.subject;
                                    }
                                }
                            });
                        });
                    }
                }
            });
            this.initDragDrop();
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

    getIncreasedDatesRange = (date, increasedBy) => {
        increasedBy -= 1;
        let firstDate = new Date(date);
        let lastDate = new Date(date);
        lastDate = new Date(lastDate.setDate(lastDate.getDate() + increasedBy));

        return this.getDateRange(firstDate, lastDate);
    }

    getDateRange = (startDate, endDate) => {
        const dates = [];
        let currentDate = startDate;
        const addDays = function (days) {
            const date = new Date(this.valueOf());
            date.setDate(date.getDate() + days);
            return date;
        }
        while (currentDate <= endDate) {
            dates.push(currentDate.toLocaleDateString());
            currentDate = addDays.call(currentDate, 1);
        }
        return dates;
    }

    initDragDrop = () => {
        const backlog = document.getElementById('backlog');
        const tableRows = document.querySelectorAll('#planningTable tbody td');
        const tickets = document.querySelectorAll('.ticket');

        tableRows.forEach((row) => {
            row.ondragover = (e) => {
                e.preventDefault();
            }
        });

        tickets.forEach((ticket) => {
            ticket.ondragstart = (e) => {
                e.dataTransfer.setData('data-ticket-id', e.target.getAttribute('data-ticket-id'));
            }
        });

        tableRows.forEach((row) => {
            row.ondrop = (e) => {
                let itemId = e.dataTransfer.getData('data-ticket-id');
                let dropElem = document.querySelector(`[data-ticket-id="${itemId}"]`);
                let daysRange = this.getDateRange(new Date(dropElem.getAttribute('data-ticket-plan-start-date')), new Date(dropElem.getAttribute('data-ticket-plan-end-date')));
                let dayStart;

                if (e.target.classList.contains('executor')) {
                    dayStart = dropElem.getAttribute('data-ticket-plan-start-date');
                } else {
                    dayStart = this.americanDateFormat(e.target.getAttribute('data-date'));
                }

                let datesRange = this.getIncreasedDatesRange(dayStart, daysRange.length);

                setCells(datesRange);

                function setCells(datesRange) {
                    datesRange.forEach((date) => {
                        let cell = e.target.parentNode.querySelector(`[data-date="${date}"]`);
                        if (cell.classList.contains('active')) {
                            cell.innerHTML += ', ' + dropElem.getAttribute('data-ticket-subject');
                        } else {
                            cell.classList.add('active');
                            cell.innerHTML = dropElem.getAttribute('data-ticket-subject');
                        }
                    });
                    dropElem.parentNode.removeChild(dropElem);
                }
            }
        });
    }

    backlogSearch = (text) => {

    }
}