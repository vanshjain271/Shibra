import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import Employees from './pages/Employees';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Categories from './pages/Categories';
import Brands from './pages/Brands';
import Blogs from './pages/Blogs';
import LotsList from './pages/LotsList';
import LotForm from './pages/LotForm';
import Orders from './pages/Orders';
import PurchaseOrders from './pages/PurchaseOrders';
import AbandonedCarts from './pages/AbandonedCarts';
import Coupons from './pages/Coupons';
import Banners from './pages/Banners';
import Reports from './pages/Reports';
import StoreSettings from './pages/StoreSettings';
import Blog from './pages/Blog';
import BulkOrders from './pages/BulkOrders';
import ActivityLog from './pages/ActivityLog';
import Reviews from './pages/Reviews';
import Login from './pages/Login';
import Wishlists from './pages/Wishlists';
import Inquiries from './pages/Inquiries';
import Profile from './pages/Profile';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },

      // Invoices
      { path: 'invoices', element: <Invoices /> },

      // Orders
      { path: 'orders/online', element: <Orders /> },
      { path: 'orders/purchase', element: <PurchaseOrders /> },
      { path: 'orders/abandoned', element: <AbandonedCarts /> },

      // Catalog
      { path: 'catalog/products', element: <Products /> },
      { path: 'catalog/products/new', element: <ProductForm /> },
      { path: 'catalog/products/:id', element: <ProductForm /> },
      { path: 'catalog/products/edit/:id', element: <ProductForm /> },
      { path: 'catalog/lots', element: <LotsList /> },
      { path: 'catalog/lots/new', element: <LotForm /> },
      { path: 'catalog/lots/:id', element: <LotForm /> },
      { path: 'catalog/lots/edit/:id', element: <LotForm /> },
      { path: 'catalog/categories', element: <Categories /> },
      { path: 'catalog/blogs', element: <Blogs /> },
      { path: 'catalog/brands', element: <Brands /> },
      { path: 'catalog/reviews', element: <Reviews /> },

      // Customers
      { path: 'customers', element: <Customers /> },
      { path: 'customers/:id', element: <CustomerDetails /> },
      { path: 'customers/wishlists', element: <Wishlists /> },

      // Employees (RBAC)
      // { path: 'employees', element: <Employees /> },

      // Promotions
      { path: 'promotions/coupons', element: <Coupons /> },
      { path: 'promotions/banners', element: <Banners /> },

      // Reports
      { path: 'reports', element: <Reports /> },

      // Store Settings
      { path: 'store/settings', element: <StoreSettings /> },
      { path: 'store/blog', element: <Blog /> },
      { path: 'bulk-orders', element: <BulkOrders /> },
      { path: 'inquiries', element: <Inquiries /> },
      { path: 'profile', element: <Profile /> },

      // Activity Log
      // { path: 'activity-log', element: <ActivityLog /> },
    ],
  },
]);
