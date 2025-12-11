import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import {
  Welcome,
  Orientation,
  HypothesisGeneration,
  Interview,
  DeficitReport,
  TrackIntro,
  TrackFeedback,
  ExitIntro,
  ExitFeedback,
  Completion,
} from './pages';

function AppRoutes() {
  const { phase, student } = useAppStore();

  // Redirect to appropriate page based on current phase if navigating directly
  const getRedirectPath = () => {
    if (!student) return '/';

    switch (phase) {
      case 'welcome': return '/';
      case 'orientation': return '/orientation';
      case 'diagnostic': return '/hypothesis-generation';
      case 'deficit_report': return '/deficit-report';
      case 'track_intro': return '/track-intro';
      case 'track_case': return '/hypothesis-generation';
      case 'track_feedback': return '/track-feedback';
      case 'exit_intro': return '/exit-intro';
      case 'exit_case': return '/hypothesis-generation';
      case 'exit_feedback': return '/exit-feedback';
      case 'completion': return '/completion';
      default: return '/';
    }
  };

  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/orientation" element={<Orientation />} />
      <Route path="/hypothesis-generation" element={<HypothesisGeneration />} />
      <Route path="/interview" element={<Interview />} />
      <Route path="/diagnostic" element={<Navigate to="/hypothesis-generation" replace />} />
      <Route path="/deficit-report" element={<DeficitReport />} />
      <Route path="/track-intro" element={<TrackIntro />} />
      <Route path="/track-feedback" element={<TrackFeedback />} />
      <Route path="/exit-intro" element={<ExitIntro />} />
      <Route path="/exit-feedback" element={<ExitFeedback />} />
      <Route path="/completion" element={<Completion />} />
      <Route path="*" element={<Navigate to={getRedirectPath()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
