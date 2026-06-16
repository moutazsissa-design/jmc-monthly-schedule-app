# JMC Monthly Schedule & Leave Calculator - Version 2

This version adds:
- Sick Leave
- Sick Leave summary card
- Sick Leave count per employee
- Exact approved shift timings

## Default Team

Admin:
- Moutaz

Employees:
- Moutaz
- Hamdan
- Askar
- Arun
- Anas

Supervisor / Viewer:
- Faizal

No supervisor approval workflow is included.

## Approved Shift Times

Employees:
- 4:00 AM - 12:00 PM
- 5:00 AM - 1:00 PM
- 12:00 PM - 8:00 PM
- 1:00 PM - 9:00 PM

Supervisor:
- 8:00 AM - 4:00 PM

## Leave / Status Types

- OFF
- Annual Leave
- Sick Leave
- Compensation Leave
- Public Holiday
- Worked on OFF
- Worked on Public Holiday

## Compensation Logic

- Worked on OFF = +1 compensation leave day
- Worked on Public Holiday = +1 compensation leave day
- Sick Leave is counted separately and does not reduce annual leave
- Sick Leave does not generate compensation leave

## How to run

Open `index.html` in a browser.

For Replit:
1. Create a new HTML/CSS/JS repl.
2. Upload these files.
3. Run/open the web preview.
