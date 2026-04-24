import { Navigate, Route } from '@solidjs/router';
import { AppLayout } from './components/layout/app-layout';
import { AdminLayout } from './components/layout/admin-layout';
import { Landing } from './pages/public/landing';
import { Cgu } from './pages/public/cgu';
import { Login } from './pages/auth/login';
import { Register } from './pages/auth/register';
import { VerifyEmail } from './pages/auth/verify-email';
import { Dashboard } from './pages/dashboard';
import { SearchPage } from './pages/search';
import { ProducerProfilePage } from './pages/producer-profile';
import { ProducerCatalog } from './pages/producer-catalog';
import { OrdersPage } from './pages/orders';
import { OrderDetailPage } from './pages/order-detail';
import { AccountPage } from './pages/account';
import { MessagesPage } from './pages/messages';
import { ConversationPage } from './pages/conversation';
import { AdminDashboard } from './pages/admin/dashboard';

export default function App() {
  return (
    <>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/cgu" component={Cgu} />

      <Route path="/app" component={AppLayout}>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/catalog" component={ProducerCatalog} />
        <Route path="/search" component={SearchPage} />
        <Route path="/producers/:id" component={ProducerProfilePage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/orders/:id" component={OrderDetailPage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/messages/:id" component={ConversationPage} />
        <Route path="/compte" component={AccountPage} />
        <Route path="/settings" component={() => <Navigate href="/app/compte" />} />
      </Route>

      <Route path="/admin" component={AdminLayout}>
        <Route path="/" component={AdminDashboard} />
      </Route>
    </>
  );
}
