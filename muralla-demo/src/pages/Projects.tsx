import { Box, Heading, HStack, SimpleGrid, Text, Badge, Select, VStack } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useDemo } from '../context/DemoContext'

export default function Projects() {
  const { data } = useDemo()
  const [stage, setStage] = useState<'all' | 'planning' | 'active' | 'completed'>('all')
  const filtered = useMemo(() => stage === 'all' ? data.projects : data.projects.filter((p: any) => p.stage === stage), [stage, data.projects])

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Proyectos</Heading>
        <Select value={stage} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStage(e.target.value as any)} maxW="220px">
          <option value="all">Todas las etapas</option>
          <option value="planning">Planificación</option>
          <option value="active">Activo</option>
          <option value="completed">Completado</option>
        </Select>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filtered.map((p: any) => (
          <Box key={p.id} p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">{p.name}</Text>
              <Badge colorScheme={p.stage === 'completed' ? 'green' : p.stage === 'active' ? 'blue' : 'gray'} textTransform="capitalize">{p.stage}</Badge>
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>{p.description}</Text>
            <HStack mt={3} justify="space-between">
              <Text fontSize="sm" color="gray.500">Responsable: {p.owner}</Text>
              <Text fontSize="sm" color="gray.500">Fecha límite: {p.deadline}</Text>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
