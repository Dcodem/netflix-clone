import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { AuthProvider } from './auth/AuthContext'
import { ProfileProvider } from './profiles/ProfileContext'
import { Account } from './pages/Account'
import { BrowseLanguages } from './pages/BrowseLanguages'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { MovieDetail } from './pages/MovieDetail'
import { MyList } from './pages/MyList'
import { MyNetflix } from './pages/MyNetflix'
import { NewsHot } from './pages/NewsHot'
import { ProfileSelect } from './pages/ProfileSelect'
import { Search } from './pages/Search'
import { ShowDetail } from './pages/ShowDetail'
import { Taste } from './pages/Taste'
import { TitleModalProvider } from './title/TitleModalContext'
import { WatchProvider } from './watch/WatchContext'

export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <WatchProvider>
          <TitleModalProvider>
            <BrowserRouter>
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
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/show/:id" element={<ShowDetail />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </TitleModalProvider>
        </WatchProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
