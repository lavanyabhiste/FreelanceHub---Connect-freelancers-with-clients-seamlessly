import { useNavigate } from 'react-router-dom';
import HealthStatus from '../components/HealthStatus';
import useAuth from '../hooks/useAuth';

// ReactBits components
import SplitText from '../components/reactbits/SplitText/SplitText';
import BlurText from '../components/reactbits/BlurText/BlurText';
import FadeContent from '../components/reactbits/FadeContent/FadeContent';
import SpotlightCard from '../components/reactbits/SpotlightCard/SpotlightCard';
import ShinyText from '../components/reactbits/ShinyText/ShinyText';
import StarBorder from '../components/reactbits/StarBorder/StarBorder';

import {
  Assignment as AssignmentIcon,
  PeopleAlt as PeopleAltIcon,
  Chat as ChatIcon,
  Verified as VerifiedIcon,
  Security as SecurityIcon,
  StarRate as StarRateIcon,
} from '@mui/icons-material';

const STACK_CHIPS = ['React', 'Redux Toolkit', 'Node.js', 'Express', 'MongoDB', 'Socket.IO'];

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const dashboardPath =
    role === 'Client'
      ? '/client/dashboard'
      : role === 'Freelancer'
        ? '/freelancer/dashboard'
        : '/admin/dashboard';

  const platformFeatures = [
    {
      icon: <AssignmentIcon fontSize="large" />,
      grad: 'linear-gradient(135deg,#6366f1,#818cf8)',
      title: 'Project Management',
      desc: 'Clients can post and manage creative, technical, and professional projects.',
    },
    {
      icon: <PeopleAltIcon fontSize="large" />,
      grad: 'linear-gradient(135deg,#06b6d4,#22d3ee)',
      title: 'Proposals & Bidding',
      desc: 'Freelancers explore listings and pitch customized proposals and rates.',
    },
    {
      icon: <ChatIcon fontSize="large" />,
      grad: 'linear-gradient(135deg,#8b5cf6,#d946ef)',
      title: 'Real-time Messaging',
      desc: 'Socket.IO powered communication between clients and approved freelancers.',
    },
    {
      icon: <VerifiedIcon fontSize="large" />,
      grad: 'linear-gradient(135deg,#f59e0b,#f97316)',
      title: 'Work Submission',
      desc: 'Milestone tracking, work submissions with Multer file uploads, and reviews.',
    },
    {
      icon: <StarRateIcon fontSize="large" />,
      grad: 'linear-gradient(135deg,#ec4899,#f43f5e)',
      title: 'Ratings & Feedback',
      desc: 'Two-way ratings and reviews establishing transparent reputation scores.',
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      grad: 'linear-gradient(135deg,#10b981,#34d399)',
      title: 'Admin Moderation',
      desc: 'Role-based access control, dispute management, and moderation dashboard.',
    },
  ];

  return (
    <div className="home-page">
      {/* ═══ Hero ═══ */}
      <section className="fh-hero text-white">
        {/* Animated blobs */}
        <div
          className="fh-hero-blob"
          style={{ width: 340, height: 340, top: -80, left: -60, background: 'rgba(99,102,241,0.6)' }}
        />
        <div
          className="fh-hero-blob"
          style={{
            width: 280,
            height: 280,
            bottom: -70,
            right: -50,
            background: 'rgba(6,182,212,0.5)',
            animationDelay: '1.6s',
          }}
        />

        <div className="container text-center position-relative" style={{ zIndex: 2 }}>
          {/* Badge with live dot */}
          <div
            className="d-inline-flex align-items-center gap-2 px-4 py-2 rounded-pill mb-4"
            style={{ background: 'rgba(11,17,32,0.45)', border: '1px solid rgba(255,255,255,0.18)' }}
          >
            <span className="fh-live-dot" />
            <ShinyText
              text="🚀 Full-Stack MERN Architecture Initialized"
              speed={4}
              color="#c7d2fe"
              shineColor="#ffffff"
              className="small fw-semibold mb-0"
            />
          </div>

          {/* Animated headline — bright gradient, layout-safe against SplitText */}
          <SplitText
            tag="h1"
            text="FreelanceHub"
            className="fh-hero-title"
            delay={60}
            duration={1}
            rootMargin="0px"
            textAlign="center"
          />
          <div className="fh-title-accent" />

          {/* Animated subtitle */}
          <div style={{ maxWidth: 720, margin: '1.75rem auto 0', color: 'rgba(226,232,240,0.9)' }}>
            <BlurText
              text="A modern freelancing platform that connects clients with top freelancers for creative, technical, and professional projects — seamlessly."
              animateBy="words"
              direction="top"
              delay={90}
              threshold={0.1}
              rootMargin="0px"
              easing={(t) => 1 - Math.pow(1 - t, 3)}
              className="lead mb-0"
            />
          </div>

          {/* CTAs — solid gradient + dark glass, always legible */}
          <div className="d-flex flex-wrap justify-content-center align-items-center gap-3 mt-4">
            <StarBorder
              as="button"
              type="button"
              color="#67e8f9"
              speed="5s"
              backgroundColor="linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)"
              textColor="#ffffff"
              borderColor="rgba(255,255,255,0.45)"
              onClick={() => navigate(isAuthenticated ? dashboardPath : '/register')}
              className="fw-bold"
            >
              {isAuthenticated ? 'Go to Dashboard →' : 'Get Started Free →'}
            </StarBorder>

            <StarBorder
              as="button"
              type="button"
              color="#a5b4fc"
              speed="6s"
              backgroundColor="rgba(11,17,32,0.55)"
              textColor="#e2e8f0"
              borderColor="rgba(255,255,255,0.35)"
              onClick={() => navigate('/projects')}
              className="fh-btn-glass fw-semibold"
            >
              🔍 Browse Projects
            </StarBorder>
          </div>

          {/* Stack chips */}
          <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
            {STACK_CHIPS.map((s) => (
              <span
                key={s}
                className="badge rounded-pill px-3 py-2"
                style={{
                  background: 'rgba(11,17,32,0.5)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  color: '#c7d2fe',
                  fontWeight: 600,
                }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Health check ═══ */}
      <div className="container" style={{ marginTop: '-3rem', position: 'relative', zIndex: 3 }}>
        <FadeContent distance={50} duration={900} threshold={0.05}>
          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <HealthStatus />
            </div>
          </div>
        </FadeContent>
      </div>

      {/* ═══ Features ═══ */}
      <section className="container py-5">
        <FadeContent className="text-center mb-4" distance={30} duration={800}>
          <span className="fh-chip mb-3 d-inline-flex">✨ Platform Capabilities</span>
          <h3 className="fw-bold fh-section-title mb-1">Everything you need to hire &amp; work</h3>
          <div className="fh-title-accent" />
          <p className="text-muted small mt-3 mb-0">
            Post projects, hire trusted talent, chat in real time, and get paid securely — all in one place
          </p>
        </FadeContent>

        <div className="row g-4">
          {platformFeatures.map((feature, idx) => (
            <div className="col-12 col-md-6 col-lg-4" key={idx}>
              <FadeContent
                distance={40}
                duration={700}
                delay={idx * 90}
                threshold={0.08}
                style={{ height: '100%' }}
              >
                <SpotlightCard
                  className="fh-feature-spotlight h-100 text-center"
                  spotlightColor="rgba(79,70,229,0.13)"
                >
                  <div className="fh-icon-tile mx-auto mb-3" style={{ background: feature.grad }}>
                    {feature.icon}
                  </div>
                  <h5 className="fw-bold mb-2">{feature.title}</h5>
                  <p className="text-muted small mb-0">{feature.desc}</p>
                </SpotlightCard>
              </FadeContent>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Closing CTA ═══ */}
      <section className="container pb-5">
        <FadeContent distance={40} duration={900}>
          <div className="fh-cta-panel rounded-4 p-4 p-md-5 text-center text-white position-relative overflow-hidden">
            <span className="fh-chip mb-3 d-inline-flex" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: '#a5b4fc' }}>
              🚀 Join thousands of makers
            </span>
            <h4 className="fw-bold mb-2">Ready to build something great?</h4>
            <p className="mb-4 mx-auto" style={{ maxWidth: 560, color: 'rgba(226,232,240,0.85)' }}>
              Join as a client to post projects, or as a freelancer to start earning on
              work you love.
            </p>
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <StarBorder
                as="button"
                type="button"
                color="#67e8f9"
                speed="5s"
                backgroundColor="linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)"
                textColor="#ffffff"
                borderColor="rgba(255,255,255,0.45)"
                onClick={() => navigate('/register')}
                className="fw-bold"
              >
                ✨ Create Account
              </StarBorder>
              <StarBorder
                as="button"
                type="button"
                color="#a5b4fc"
                speed="6s"
                backgroundColor="rgba(11,17,32,0.55)"
                textColor="#e2e8f0"
                borderColor="rgba(255,255,255,0.35)"
                onClick={() => navigate('/login')}
                className="fh-btn-glass fw-semibold"
              >
                I already have an account
              </StarBorder>
            </div>
          </div>
        </FadeContent>
      </section>
    </div>
  );
}
