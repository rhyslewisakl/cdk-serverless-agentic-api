# React Cloudscape Example Application

A complete example React application built with AWS Cloudscape Design System, demonstrating a full-stack serverless architecture with authentication, CRUD operations, and modern UI/UX patterns.

## 🚀 Features

- **Authentication**: Complete user registration, login, and email confirmation flow
- **CRUD Operations**: Create, read, update, and delete items with real-time feedback
- **Responsive Design**: Mobile-first design that works on all screen sizes
- **Accessibility**: WCAG compliant with proper ARIA labels and keyboard navigation
- **Performance**: Code splitting, lazy loading, and optimized bundle sizes
- **Error Handling**: Comprehensive error boundaries and user notifications
- **Modern Stack**: React 18, TypeScript, Redux Toolkit, React Router, Vite

## 🏗️ Architecture

```
Frontend (React + Cloudscape)
├── Authentication (AWS Cognito)
├── API Layer (Axios + JWT)
├── State Management (Redux Toolkit)
├── Routing (React Router)
└── UI Components (Cloudscape Design System)

Backend (CDK Serverless Stack)
├── CloudFront Distribution
├── S3 Static Hosting
├── API Gateway
├── Lambda Functions
├── DynamoDB
└── Cognito User Pool
```

## 📋 Prerequisites

- Node.js 18+ and npm
- AWS CLI configured
- AWS CDK v2 installed
- Modern web browser

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cdk-serverless-agentic-api/examples/react-example-app-cloudscape
   ```

2. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Deploy the backend infrastructure**
   ```bash
   cd ../infrastructure
   npm install
   cdk deploy
   ```

4. **Configure frontend with backend endpoints**
   - Copy the CloudFront URL from CDK output
   - Update any configuration files if needed

## 🚀 Development

### Start Development Server
```bash
cd frontend
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── auth/            # Authentication components
│   │   ├── common/          # Shared components (LoadingSpinner, etc.)
│   │   ├── items/           # Item management components
│   │   ├── layout/          # Layout components (AppLayout)
│   │   └── routing/         # Router configuration
│   ├── pages/               # Page components
│   │   ├── DashboardPage.tsx
│   │   └── ItemsPage.tsx
│   ├── services/            # API and authentication services
│   │   ├── api.ts
│   │   └── auth.ts
│   ├── store/               # Redux store and slices
│   │   ├── appSlice.ts
│   │   ├── authSlice.ts
│   │   ├── itemsSlice.ts
│   │   └── notificationSlice.ts
│   ├── types/               # TypeScript type definitions
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
└── dist/                    # Production build output
```

## 🔧 Key Components

### Authentication Flow
- **LoginPage**: User login with email/password
- **RegisterPage**: New user registration
- **ConfirmEmailPage**: Email verification with confirmation code
- **PrivateRoute**: Route protection for authenticated users

### Item Management
- **ItemsList**: Table view with CRUD operations
- **ItemForm**: Create/edit form with validation
- **Dashboard**: Statistics and recent items overview

### Layout & Navigation
- **AppLayout**: Main layout with sidebar navigation
- **ErrorBoundary**: Global error handling
- **NotificationProvider**: Toast notifications

## 🎨 Styling & Theming

The application uses AWS Cloudscape Design System for consistent, accessible UI components:

- **Components**: Table, Form, Button, Modal, etc.
- **Layout**: AppLayout, Container, Box, SpaceBetween
- **Responsive**: Built-in responsive behavior
- **Accessibility**: WCAG 2.1 AA compliant

## 🔐 Authentication

Authentication is handled through AWS Cognito:

1. **Registration**: Email + password with email verification
2. **Login**: JWT token-based authentication
3. **Session Management**: Automatic token refresh
4. **Protected Routes**: Route-level authentication guards

## 📊 State Management

Redux Toolkit is used for state management:

- **authSlice**: User authentication state
- **itemsSlice**: Items CRUD operations
- **appSlice**: Application initialization
- **notificationSlice**: Toast notifications

## 🌐 API Integration

RESTful API integration with:

- **Base URL**: Automatic detection from current origin
- **Authentication**: JWT Bearer tokens
- **Error Handling**: Automatic retry and error reporting
- **Endpoints**: `/api/items` for CRUD operations

## 📱 Responsive Design

Mobile-first responsive design:

- **Breakpoints**: Optimized for mobile, tablet, desktop
- **Navigation**: Collapsible sidebar on mobile
- **Tables**: Horizontal scrolling on small screens
- **Forms**: Touch-friendly inputs and buttons

## ♿ Accessibility

WCAG 2.1 AA compliant:

- **ARIA Labels**: All interactive elements labeled
- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: Semantic HTML and descriptions
- **Color Contrast**: Meets accessibility standards

## ⚡ Performance

Optimized for performance:

- **Code Splitting**: Route-based lazy loading
- **Bundle Optimization**: Separate vendor chunks
- **Caching**: Optimized browser caching strategy
- **Loading States**: Skeleton loading and spinners

## 🐛 Error Handling

Comprehensive error handling:

- **Error Boundaries**: Catch React component errors
- **API Errors**: User-friendly error messages
- **Form Validation**: Real-time validation feedback
- **Network Errors**: Automatic retry mechanisms

## 🧪 Testing

Testing setup (ready for implementation):

- **Unit Tests**: Jest + React Testing Library
- **Integration Tests**: End-to-end user flows
- **Accessibility Tests**: Automated a11y testing
- **Performance Tests**: Bundle size monitoring

## 🚀 Deployment

The application is deployed as a static site:

1. **Build**: `npm run build` creates optimized production build
2. **Upload**: Files uploaded to S3 bucket
3. **CDN**: Served through CloudFront for global distribution
4. **SSL**: Automatic HTTPS with AWS Certificate Manager

## 🔧 Configuration

Key configuration files:

- **vite.config.ts**: Build and development server config
- **tsconfig.json**: TypeScript configuration
- **package.json**: Dependencies and scripts

## 📈 Monitoring

Built-in monitoring capabilities:

- **Error Tracking**: Error boundary reporting
- **Performance Metrics**: Bundle size analysis
- **User Analytics**: Ready for integration
- **API Monitoring**: Request/response logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Check the documentation
- Review the code examples
- Open an issue on GitHub
- Refer to AWS Cloudscape documentation

## 🔗 Related Links

- [AWS Cloudscape Design System](https://cloudscape.design/)
- [React Documentation](https://react.dev/)
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [AWS CDK](https://aws.amazon.com/cdk/)
- [Vite](https://vitejs.dev/)