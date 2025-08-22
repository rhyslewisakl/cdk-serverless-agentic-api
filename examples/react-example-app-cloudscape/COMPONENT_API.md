# Component API Documentation

This document describes the API for key components in the React Cloudscape Example Application.

## 🧩 Core Components

### AppLayout

Main application layout component providing consistent structure across all pages.

```typescript
interface AppLayoutProps {
  children: React.ReactNode;
  breadcrumbs?: Array<{ text: string; href?: string }>;
}
```

**Features:**
- Responsive sidebar navigation
- Breadcrumb navigation
- User authentication controls
- Consistent page structure

**Usage:**
```tsx
<AppLayout breadcrumbs={[{ text: 'Dashboard' }]}>
  <YourPageContent />
</AppLayout>
```

### ItemForm

Form component for creating and editing items with validation.

```typescript
interface ItemFormProps {
  item?: Item;
  onSuccess: () => void;
  onCancel: () => void;
}
```

**Features:**
- Real-time form validation
- Accessibility compliant inputs
- Loading states during submission
- Error handling and display

**Usage:**
```tsx
<ItemForm
  item={editingItem}
  onSuccess={() => setModalVisible(false)}
  onCancel={() => setModalVisible(false)}
/>
```

### ItemsList

Table component displaying items with CRUD operations.

```typescript
interface ItemsListProps {
  onCreateClick: () => void;
  onEditClick: (item: Item) => void;
}
```

**Features:**
- Sortable and resizable columns
- Bulk selection
- Delete confirmation modals
- Loading and empty states

**Usage:**
```tsx
<ItemsList
  onCreateClick={() => setShowCreateModal(true)}
  onEditClick={(item) => handleEdit(item)}
/>
```

### LoadingSpinner

Reusable loading indicator component.

```typescript
interface LoadingSpinnerProps {
  size?: 'normal' | 'large';
  text?: string;
}
```

**Usage:**
```tsx
<LoadingSpinner size="large" text="Loading items..." />
```

### SkeletonLoader

Animated skeleton loading component for tables and lists.

```typescript
interface SkeletonLoaderProps {
  rows?: number;
  height?: string;
}
```

**Usage:**
```tsx
<SkeletonLoader rows={5} height="50px" />
```

## 🔐 Authentication Components

### LoginPage

User login form with email and password validation.

**Features:**
- Form validation
- Loading states
- Error handling
- Forgot password link

### RegisterPage

User registration form with email verification.

**Features:**
- Password strength validation
- Email format validation
- Terms acceptance
- Loading states

### ConfirmEmailPage

Email confirmation with verification code input.

**Features:**
- Code input validation
- Resend code functionality
- Auto-focus inputs
- Error handling

### PrivateRoute

Route protection component for authenticated users.

```typescript
interface PrivateRouteProps {
  children: React.ReactNode;
}
```

**Usage:**
```tsx
<PrivateRoute>
  <ProtectedPage />
</PrivateRoute>
```

## 🔧 Utility Components

### ErrorBoundary

Global error boundary for catching React component errors.

**Features:**
- Error logging
- User-friendly error display
- Page refresh option
- Fallback UI

### NotificationProvider

Toast notification system using Cloudscape Flashbar.

**Features:**
- Auto-dismiss notifications
- Manual dismiss option
- Different notification types
- Queue management

## 📊 Redux Slices

### authSlice

Manages user authentication state and operations.

**State:**
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `signInAsync` - User login
- `signUpAsync` - User registration
- `confirmSignUpAsync` - Email confirmation
- `signOutAsync` - User logout
- `checkAuthAsync` - Check authentication status

### itemsSlice

Manages items CRUD operations and state.

**State:**
```typescript
interface ItemsState {
  items: Item[];
  isLoading: boolean;
  error: string | null;
}
```

**Actions:**
- `fetchItemsAsync` - Fetch all items
- `createItemAsync` - Create new item
- `updateItemAsync` - Update existing item
- `deleteItemAsync` - Delete item

### notificationSlice

Manages toast notifications.

**State:**
```typescript
interface NotificationState {
  notifications: Notification[];
}
```

**Actions:**
- `addNotification` - Add new notification
- `removeNotification` - Remove notification
- `clearNotifications` - Clear all notifications

**Helper Actions:**
- `showSuccess` - Show success notification
- `showError` - Show error notification
- `showWarning` - Show warning notification
- `showInfo` - Show info notification

## 🌐 Services

### ApiService

HTTP client service for backend API communication.

**Methods:**
```typescript
class ApiService {
  initialize(): Promise<void>
  getItems(): Promise<Item[]>
  createItem(item: CreateItemRequest): Promise<Item>
  updateItem(itemId: string, updates: UpdateItemRequest): Promise<Item>
  deleteItem(itemId: string): Promise<void>
}
```

**Features:**
- Automatic authentication token injection
- Request/response interceptors
- Error handling and retry logic
- Type-safe API methods

### AuthService

Authentication service for Cognito integration.

**Methods:**
```typescript
class AuthService {
  initialize(): Promise<void>
  signIn(params: SignInParams): Promise<User>
  signUp(params: SignUpParams): Promise<void>
  confirmSignUp(params: ConfirmSignUpParams): Promise<void>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  getAuthToken(): Promise<string | null>
}
```

## 📱 Responsive Behavior

### Breakpoints

Components adapt to different screen sizes:

- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Responsive Features

- **Navigation**: Collapsible sidebar on mobile
- **Tables**: Horizontal scrolling on small screens
- **Forms**: Touch-friendly inputs
- **Buttons**: Responsive text and sizing
- **Cards**: Adaptive grid layouts

## ♿ Accessibility Features

### ARIA Support

All components include proper ARIA attributes:

- `aria-label` for interactive elements
- `aria-describedby` for form fields
- `aria-expanded` for collapsible content
- `role` attributes for semantic meaning

### Keyboard Navigation

Full keyboard support:

- Tab navigation through all interactive elements
- Enter/Space for button activation
- Escape to close modals
- Arrow keys for table navigation

### Screen Reader Support

- Semantic HTML structure
- Descriptive text for all actions
- Status announcements for dynamic content
- Proper heading hierarchy

## 🎨 Theming

Components use Cloudscape Design System theming:

- Consistent color palette
- Standardized spacing
- Typography scale
- Icon library
- Motion and transitions

## 🔧 Customization

### Extending Components

Components can be extended or customized:

```tsx
// Custom wrapper component
const CustomItemForm = (props) => {
  return (
    <div className="custom-form-wrapper">
      <ItemForm {...props} />
    </div>
  );
};
```

### Styling

Use Cloudscape tokens for consistent styling:

```tsx
<Box padding="l" margin={{ top: 'm', bottom: 's' }}>
  Content
</Box>
```

## 📋 Best Practices

### Component Usage

1. **Always provide required props**
2. **Handle loading and error states**
3. **Use proper TypeScript types**
4. **Follow accessibility guidelines**
5. **Test responsive behavior**

### Performance

1. **Use lazy loading for routes**
2. **Memoize expensive calculations**
3. **Optimize re-renders with React.memo**
4. **Use proper key props in lists**
5. **Minimize bundle size**