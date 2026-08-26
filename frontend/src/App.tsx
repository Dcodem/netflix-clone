import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ProfileProvider } from './profiles/ProfileContext'
import { Home } from './pages/Home'
import { MovieDetail } from './pages/MovieDetail'
import { ProfileSelect } from './pages/ProfileSelect'
import { Search } from './pages/Search'
import { ShowDetail } from './pages/ShowDetail'
import { WatchProvider } from './watch/WatchContext'

export default function App() {
  return (
    <ProfileProvider>
      <WatchProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<ProfileSelect />} />
            <Route element={<AppLayout />}>
              <Route path="/browse" element={<Home filter="home" />} />
              <Route path="/browse/movies" element={<Home filter="movies" />} />
              <Route path="/browse/shows" element={<Home filter="shows" />} />
              <Route path="/search" element={<Search />} />
              <Route path="/movie/:id" element={<MovieDetail />} />
              <Route path="/show/:id" element={<ShowDetail />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </WatchProvider>
    </ProfileProvider>
  )
}
