<div align="center">
  <h1>📍 Ceylon Map Filter</h1>
  <p><strong>A beautifully crafted, feature-rich map filtering application for Sri Lanka.</strong></p>
</div>

<br />

## 🌟 Overview

**Ceylon Map Filter** is a modern Next.js application designed to seamlessly visualize, filter, and export location-based data across Sri Lanka. With an intuitive interface, users can toggle between different views, easily search for places, and export their filtered data into professional formats.

---

## 📸 Screenshots

Here is a glimpse of what the application looks like:

### Map View
![Map View](./public/map%20view.png)

### Dropdown View
![Dropdown View](./public/dropdown%20view.png)

### Table View
![Table View](./public/table%20view.png)

---

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine. We recommend using `npm`, `yarn`, or `pnpm` as your package manager.

### Installation

1. **Navigate into the project directory**:
   ```bash
   cd Ceylon-Map-Filter
   ```
2. **Install the dependencies**:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

---

## 🔑 Obtaining the API Key

This application relies on Google Maps to display geographical data. You will need a **Google Maps API Key** with the appropriate permissions.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.
3. Navigate to **APIs & Services > Library**.
4. Search for and enable the following APIs:
   - **Maps JavaScript API**
   - **Places API (New)**
   - **Geocoding API**
5. Go to **APIs & Services > Credentials**.
6. Click **Create Credentials** and select **API Key**.
7. Copy your new API key.
8. Create a `.env` file in the root of the project (you can use `.env.example` as a template).
9. Add your key to the `.env` file:
   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
   ```

---

## 💻 Running the Application

Once your dependencies are installed and your environment variables are configured, start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application in action.

---

## 📦 Core Packages

This project leverages several powerful libraries to deliver its functionality:

| Package | Purpose |
| :--- | :--- |
| **[`next`](https://nextjs.org/)** | The core React framework powering the server-side rendering, routing, and overall architecture. |
| **[`@vis.gl/react-google-maps`](https://visgl.github.io/react-google-maps/)** | Provides comprehensive React components for the Google Maps API, enabling the interactive map interface. |
| **[`sl-address`](https://www.npmjs.com/package/sl-address)** | A specialized utility for handling, parsing, and filtering Sri Lankan specific administrative divisions like provinces, districts and cities. |
| **[`exceljs`](https://github.com/exceljs/exceljs)** | Enables the robust generation of Excel `.xlsx` spreadsheets for easy data export of your filtered locations. |
| **[`pdfmake`](https://pdfmake.github.io/docs/)** | Used to generate clean, formatted PDF documents from the filtered map data. |
| **[`tailwindcss`](https://tailwindcss.com/)** | Provides utility-first styling to create the beautiful, responsive, and modern user interface. |

---

<div align="center">
  <p>Built with ❤️ for mapping Sri Lanka.</p>
</div>
