import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import 'semantic-ui-css/semantic.min.css';

import App from './App.jsx';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import Tasks from './pages/Tasks';
import NotFound from './pages/NotFound';
import Members from './pages/Members'
import Contact from './pages/Contact.jsx'
import AboutUs from './pages/AboutUs.jsx'
import TimeSlider from './components/TimeSlider.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Home />
      }, {
        path: '/dashboard',
        element: <Dashboard />
      }, {
        path: '/events',
        element: <Events />
      },
      {
        path: '/tasks',
        element: <Tasks />
      },
      {
        path: '/members',
        element: <Members />
      },
      {
        path: '/about',
        element: <AboutUs />
      },
      {
        path: '/contact',
        element: <Contact />
      },
      {
        path: '/temp',
        element: <TimeSlider />
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />
);
