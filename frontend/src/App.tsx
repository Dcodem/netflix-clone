import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthProvider } from './auth/AuthContext'
import { ProfileProvider } from './profiles/ProfileContext'
import { ProfileSync } from './profiles/ProfileSync'
import { Account } from './pages/Account'
import { Faq } from './pages/Faq'
import { GiftCards } from './pages/GiftCards'
import { HelpCenter } from './pages/HelpCenter'
import { BrowseLanguages } from './pages/BrowseLanguages'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MyList } from './pages/MyList'
import { MyNetflix } from './pages/MyNetflix'
import { NewsHot } from './pages/NewsHot'
import { ProfileSelect } from './pages/ProfileSelect'
import { Search } from './pages/Search'
import { Onboarding } from './pages/Onboarding'
import { SiteInfo } from './pages/SiteInfo'
import { SpeedTest } from './pages/SpeedTest'
import { TvPair } from './pages/TvPair'
import { WaysToWatch } from './pages/WaysToWatch'
import { TitleModalProvider, titleHref } from './title/TitleModalContext'
import { WatchProvider } from './watch/WatchContext'

function LegacyTitleRedirect() {
  const { id = '' } = useParams()
  return <Navigate to={id ? titleHref(id) : '/browse'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ProfileSync />
        <WatchProvider>
          <BrowserRouter>
            <TitleModalProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/terms" element={<SiteInfo page="terms" />} />
                <Route path="/privacy" element={<SiteInfo page="privacy" />} />
                <Route path="/legal" element={<SiteInfo page="legal" />} />
                <Route path="/corporate" element={<SiteInfo page="corporate" />} />
                <Route path="/investors" element={<SiteInfo page="investors" />} />
                <Route path="/jobs" element={<SiteInfo page="jobs" />} />
                <Route path="/contact" element={<SiteInfo page="contact" />} />
                <Route path="/media" element={<SiteInfo page="media" />} />
                <Route path="/" element={<ProfileSelect />} />
                <Route element={<AppLayout />}>
                  <Route path="/browse" element={<Home filter="home" />} />
                  <Route path="/browse/movies" element={<Home filter="movies" />} />
                  <Route path="/browse/shows" element={<Home filter="shows" />} />
                  <Route path="/browse/latest" element={<NewsHot />} />
                  <Route path="/browse/my-list" element={<MyList />} />
                  <Route path="/browse/languages" element={<BrowseLanguages />} />
                  <Route path="/browse/my-netflix" element={<MyNetflix />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/taste" element={<Navigate to="/browse" replace />} />
                  <Route path="/account" element={<Account />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/faq" element={<Faq />} />
                  <Route path="/gift" element={<GiftCards />} />
                  <Route path="/speed" element={<SpeedTest />} />
                  <Route path="/ways" element={<WaysToWatch />} />
                  <Route path="/tv" element={<TvPair />} />
                  <Route path="/movie/:id" element={<LegacyTitleRedirect />} />
                  <Route path="/show/:id" element={<LegacyTitleRedirect />} />
                </Route>
              </Routes>
            </TitleModalProvider>
          </BrowserRouter>
        </WatchProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
