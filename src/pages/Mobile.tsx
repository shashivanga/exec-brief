import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MobileCardSwiper } from "@/components/mobile/MobileCardSwiper";

const Mobile = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if onboarding is completed
    const onboardingCompleted = localStorage.getItem('decks-onboarding-completed');
    if (!onboardingCompleted) {
      navigate('/onboarding', { replace: true });
    }
  }, [navigate]);

  // Get onboarding data for personalization
  const getOnboardingData = () => {
    try {
      const data = localStorage.getItem('decks-onboarding');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const onboardingData = getOnboardingData();

  return (
    <MobileCardSwiper
      competitorName={onboardingData?.competitors?.[0] || "TechCorp"}
      industryName={onboardingData?.industry || "Technology"}
    />
  );
};

export default Mobile;