import { Box, Grid, GridItem, Heading, VStack, HStack, Text, Select } from '@chakra-ui/react'
import SummaryCard from '../components/common/SummaryCard'
import { ResponsiveBar } from '@nivo/bar'
import { ResponsivePie } from '@nivo/pie'
import { useState } from 'react'
import { useDemo } from '../context/DemoContext'

export default function Dashboard() {
  const [range, setRange] = useState('90d')
  const { data } = useDemo()
  return (
    <VStack align="stretch" spacing={6}>
      <HStack justify="space-between">
        <Heading size="lg">Resumen</Heading>
        <Select value={range} onChange={(e) => setRange(e.target.value)} maxW="220px">
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
          <option value="1y">Último año</option>
        </Select>
      </HStack>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
        <SummaryCard title="Proyectos activos" value={data.kpis.projects.toString()} subtext="↑ 12% vs período anterior" accent="green.400" />
        <SummaryCard title="Tareas abiertas" value={data.kpis.openTasks.toString()} subtext="↔ estable" />
        <SummaryCard title="Personas en equipo" value={data.kpis.team.toString()} subtext="Nuevos: 3" />
        <SummaryCard title="Ingresos" value={`$${data.kpis.revenue.toLocaleString()}`} subtext="↑ 8% vs período anterior" accent="green.400" />
      </Grid>

      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem h="360px" bg="white" _dark={{ bg: 'gray.800' }} rounded="lg" borderWidth="1px" p={4}>
          <Heading size="sm" mb={2}>Ingresos por mes</Heading>
          <Box h="300px">
            <ResponsiveBar
              data={data.revenueByMonth}
              keys={["revenue"]}
              indexBy="month"
              margin={{ top: 10, right: 10, bottom: 40, left: 50 }}
              padding={0.3}
              colors={{ scheme: 'nivo' }}
              enableLabel={false}
              axisBottom={{ tickRotation: -30 }}
            />
          </Box>
        </GridItem>

        <GridItem h="360px" bg="white" _dark={{ bg: 'gray.800' }} rounded="lg" borderWidth="1px" p={4}>
          <Heading size="sm" mb={2}>Tareas por estado</Heading>
          <Box h="300px">
            <ResponsivePie
              data={data.tasksByStatus}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              innerRadius={0.6}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
            />
          </Box>
        </GridItem>
      </Grid>

      <Box bg="white" _dark={{ bg: 'gray.800' }} rounded="lg" borderWidth="1px" p={4}>
        <Heading size="sm" mb={3}>Actividad reciente</Heading>
        <VStack align="stretch" spacing={3}>
          {data.activityFeed.map((a: any) => (
            <HStack key={a.id} justify="space-between">
              <Text>{a.text}</Text>
              <Text color="gray.500" fontSize="sm">{a.time}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>
    </VStack>
  )
}
