import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { usePDF } from 'react-to-pdf'
import { CalendarDays, Download, Upload } from 'lucide-react'
import Papa from 'papaparse'

const localizer = momentLocalizer(moment)

interface Event {
  id: number
  title: string
  start: Date
  end: Date
}

function App() {
  const [events, setEvents] = useState<Event[]>([])
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())

  const { toPDF, targetRef } = usePDF({filename: 'schedule.pdf'})

  useEffect(() => {
    const storedEvents = localStorage.getItem('calendarEvents')
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents).map((event: Event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      })))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('calendarEvents', JSON.stringify(events))
  }, [events])

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()
    const newEvent: Event = {
      id: events.length + 1,
      title: name,
      start: new Date(startDate),
      end: new Date(endDate),
    }
    setEvents([...events, newEvent])
    setName('')
    setStartDate('')
    setEndDate('')
  }

  const handleNavigate = (date: Date) => {
    setCurrentDate(date)
  }

  const parseDate = (dateString: string): Date | null => {
    const formats = [
      'DD/MM',
      'DD/MM/YYYY',
      'YYYY年MM月DD日',
      'MM月DD日'
    ]
    for (const format of formats) {
      const date = moment(dateString, format, true)
      if (date.isValid()) {
        return date.year(currentDate.getFullYear()).toDate()
      }
    }
    return null
  }

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const newEvents: Event[] = []
          results.data.forEach((row: any, index: number) => {
            if (index === 0 || !row[0] || !row[1]) return // Skip header and empty rows
            const name = row[0]
            const dates = row[1].split(',').map((date: string) => date.trim())
            dates.forEach((dateString: string) => {
              if (dateString.toLowerCase() !== 'n/a') {
                const date = parseDate(dateString)
                if (date) {
                  newEvents.push({
                    id: newEvents.length + 1,
                    title: name,
                    start: date,
                    end: new Date(date.getTime() + 24 * 60 * 60 * 1000), // End date is start date + 1 day
                  })
                }
              }
            })
          })
          setEvents(prevEvents => [...prevEvents, ...newEvents])
        },
      })
    }
  }, [currentDate])

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <CalendarDays className="mr-2" /> Scheduling App
        </h1>
        
        <form onSubmit={handleAddEvent} className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Person's Name"
            className="border rounded p-2"
            required
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2"
            required
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-2"
            required
          />
          <button type="submit" className="bg-blue-500 text-white rounded p-2 hover:bg-blue-600">
            Add to Calendar
          </button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button type="button" className="bg-green-500 text-white rounded p-2 hover:bg-green-600 w-full flex items-center justify-center">
              <Upload className="mr-2" /> Import CSV
            </button>
          </div>
        </form>

        <div ref={targetRef} className="mb-8" style={{ height: 'calc(100vh - 300px)', minHeight: '600px' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            date={currentDate}
            onNavigate={handleNavigate}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={() => toPDF()}
            className="bg-green-500 text-white rounded p-2 hover:bg-green-600 flex items-center"
          >
            <Download className="mr-2" /> Export as PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export default App