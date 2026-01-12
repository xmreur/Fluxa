import { Routes, Route } from 'react-router'
import './App.css'
import AuthProtectedLayout from './components/AuthProtectedLayout'
import { Auth } from './pages/Auth'
import { Settings } from './pages/Settings'
import { Dashboard } from './pages/Dashboard'
import { Teams } from './pages/Teams'
import { Projects } from './pages/Projects'
import { ProjectPage } from './pages/ProjectPage'
import { Inbox } from './pages/Inbox'
import { Issues } from './pages/Issues'
import { IssuePage } from './pages/IssuePage'

function App() {

    return (
        <Routes>
            <Route path='/auth' element={<Auth />} />

            <Route element={<AuthProtectedLayout />}>
                <Route path='' element={<Dashboard />} />

                <Route path='/inbox' element={<Inbox />} />

                <Route path='/issues' element={<Issues />} />
                <Route path='/issues/:issueId' element={<IssuePage />} />

                <Route path='/projects' element={<Projects />} />
                <Route path='/projects/:projectId' element={<ProjectPage />} />
                
                <Route path='/teams' element={<Teams />} />
                
                <Route path='/settings' element={<Settings />} />

                <Route path='*' element={<h1 className='text-6xl text-white'>Page Not Found</h1>} />
            </Route>

            <Route path='*' element={<p>Page Not Found</p>} />
        </Routes>
    )
}

export default App
