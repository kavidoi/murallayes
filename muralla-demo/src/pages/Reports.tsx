import { Box, Heading, HStack, Select, VStack } from '@chakra-ui/react'
import { useState, type ChangeEvent } from 'react'
import { ResponsiveBar } from '@nivo/bar'
import { useDemo } from '../context/DemoContext'

export default function Reports() {
  const [range, setRange] = useState<'q1' | 'q2' | 'q3' | 'q4'>('q3')
  const { data } = useDemo()

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Reportes</Heading>
        <Select value={range} onChange={(e: ChangeEvent<HTMLSelectElement>) => setRange(e.target.value as any)} maxW="220px">
          <option value="q1">Trimestre 1</option>
          <option value="q2">Trimestre 2</option>
          <option value="q3">Trimestre 3</option>
          <option value="q4">Trimestre 4</option>
        </Select>
      </HStack>

      <Box h="440px" bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg" p={4}>
        <ResponsiveBar
          data={data.reportBarData}
          keys={["revenue", "costs", "profit"]}
          indexBy="month"
          margin={{ top: 10, right: 20, bottom: 40, left: 50 }}
          padding={0.3}
          groupMode="grouped"
          colors={{ scheme: 'category10' }}
          enableLabel={false}
          axisBottom={{ tickRotation: -30 }}
        />
      </Box>
    </VStack>
  )
}
