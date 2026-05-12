import { Navigate, Route } from '@solidjs/router';
import { AppLayout } from './components/layout/app-layout';
import { AdminLayout } from './components/layout/admin-layout';
import { PublicAuthGate } from './components/guards/app-gate';
import { AdminGate } from './components/guards/admin-gate';
import { Landing } from './pages/public/landing';
import { Cgu } from './pages/public/cgu';
import { PreRegistration } from './pages/public/pre-registration';
import { PreRegistrationConfirm } from './pages/public/pre-registration-confirm';
import { InvitationRegister } from './pages/public/invitation-register';
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
import { AdminUsers } from './pages/admin/users';
import { AdminUserDetailPage } from './pages/admin/user-detail';
import { AdminPreRegistrations } from './pages/admin/pre-registrations';
import { AdminSurveys } from './pages/admin/surveys';
import { AdminReports } from './pages/admin/reports';
import { AdminReportDetailPage } from './pages/admin/report-detail';
import { AdminAudit } from './pages/admin/audit';

function GatedAdminLayout(props: Parameters<typeof AdminLayout>[0]) {
  return (
    <AdminGate>
      <AdminLayout {...props} />
    </AdminGate>
  );
}

export default function App() {
  return (
    <>
      <Route path="/" component={Landing} />
      <Route path="/pre-inscription" component={PreRegistration} />
      <Route path="/pre-inscription/confirme" component={PreRegistrationConfirm} />
      <Route path="/inscription" component={InvitationRegister} />
      <Route path="/login" component={Login} />
      <Route
        path="/register"
        component={() => (
          <PublicAuthGate>
            <Register />
          </PublicAuthGate>
        )}
      />
      <Route
        path="/verify-email"
        component={() => (
          <PublicAuthGate>
            <VerifyEmail />
          </PublicAuthGate>
        )}
      />
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

      <Route path="/admin" component={GatedAdminLayout}>
        <Route path="/" component={AdminDashboard} />
        <Route path="/pre-inscriptions" component={AdminPreRegistrations} />
        <Route path="/questionnaires" component={AdminSurveys} />
        <Route path="/users" component={() => <AdminUsers mode="all" />} />
        <Route path="/users/pending" component={() => <AdminUsers mode="pending" />} />
        <Route path="/users/:id" component={AdminUserDetailPage} />
        <Route path="/reports" component={AdminReports} />
        <Route path="/reports/:id" component={AdminReportDetailPage} />
        <Route path="/audit" component={AdminAudit} />
      </Route>
    </>
  );
}
