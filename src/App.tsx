import React, { useState, useEffect, useCallback } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Palmtree, Upload, Plus } from 'lucide-react'
import Papa from 'papaparse'

const localizer = momentLocalizer(moment)

interface Event {
  id: number
  title: string
  start: Date
  end: Date
}

export default function HolidayCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentDate, setCurrentDate] = useState(new Date())

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
                const [date, time] = dateString.split(' - ')
                const parsedDate = moment(date, 'DD/MM').year(currentDate.getFullYear())
                
                if (parsedDate.isValid()) {
                  const eventTitle = time === '00:00' ? name : `${name} - ${time}`
                  newEvents.push({
                    id: newEvents.length + 1,
                    title: eventTitle,
                    start: parsedDate.toDate(),
                    end: new Date(parsedDate.clone().add(1, 'day').toDate()),
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

  useEffect(() => {
    const storedEvents = localStorage.getItem('holidayCalendarEvents')
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents).map((event: Event) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      })))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('holidayCalendarEvents', JSON.stringify(events))
  }, [events])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Palmtree className="mr-2 text-teal-600" size={32} />
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-transparent bg-clip-text">
              Holiday Calendar
            </span>
          </h1>
          {/* Export button removed */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleAddEvent} className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
            <div className="col-span-1 md:col-span-2 lg:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Teacher Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter teacher name"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <button type="submit" className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-md px-4 py-2 hover:from-teal-500 hover:to-cyan-600 transition duration-300 ease-in-out flex items-center justify-center shadow-md">
                <Plus className="mr-2" /> Add Holiday
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">&nbsp;</label>
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <button type="button" className="w-full bg-gradient-to-r from-teal-400 to-cyan-500 text-white rounded-md px-4 py-2 hover:from-teal-500 hover:to-cyan-600 transition duration-300 ease-in-out flex items-center justify-center shadow-md">
                  <Upload className="mr-2" /> Import CSV
                </button>
              </div>
            </div>
          </form>

          <div className="calendar-container bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 250px)' }}>
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              date={currentDate}
              onNavigate={handleNavigate}
              views={['month', 'agenda']}
              formats={{
                dayFormat: (date, culture, localizer) =>
                  localizer.format(date, 'D', culture),
              }}
              components={{
                month: {
                  dateHeader: ({ label }) => (
                    <span className="rbc-date-cell">
                      {label}
                    </span>
                  ),
                },
              }}
            />
          </div>
        </div>
      </main>
    </div>
  )
}