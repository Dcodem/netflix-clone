import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthProvider } from './auth/AuthContext'
import { ProfileProvider } from './profiles/ProfileContext'
import { Account } from './pages/Account'
import { BrowseLanguages } from './pages/BrowseLanguages'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MyList } from './pages/MyList'
import { MyNetflix } from './pages/MyNetflix'
import { NewsHot } from './pages/NewsHot'
import { ProfileSelect } from './pages/ProfileSelect'
import { Search } from './pages/Search'
import { Taste } from './pages/Taste'
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
        <WatchProvider>
          <BrowserRouter>
            <TitleModalProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
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
                  <Route path="/taste" element={<Taste />} />
                  <Route path="/account" element={<Account />} />
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
