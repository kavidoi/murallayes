import { Box, Heading, HStack, Select, SimpleGrid, VStack, Text, Badge, Button } from '@chakra-ui/react'
import { useMemo, useState } from 'react'
import { useDemo } from '../context/DemoContext'

const StatusBadge = ({ status }: { status: string }) => {
  const label = status === 'Done' ? 'Lista' : status === 'In Progress' ? 'En progreso' : 'Por hacer'
  return <Badge colorScheme={status === 'Done' ? 'green' : status === 'In Progress' ? 'yellow' : 'gray'}>{label}</Badge>
}

export default function Tasks() {
  const { data } = useDemo()
  const [filter, setFilter] = useState<'all' | 'todo' | 'progress' | 'done'>('all')
  const filteredTasks = useMemo(() => {
    switch (filter) {
      case 'todo': return data.tasks.filter((t: any) => t.status === 'Todo')
      case 'progress': return data.tasks.filter((t: any) => t.status === 'In Progress')
      case 'done': return data.tasks.filter((t: any) => t.status === 'Done')
      default: return data.tasks
    }
  }, [filter, data.tasks])

  return (
    <VStack align="stretch" spacing={4}>
      <HStack justify="space-between">
        <Heading size="lg">Tareas</Heading>
        <HStack>
          <Select value={filter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value as any)} maxW="220px">
            <option value="all">Todas</option>
            <option value="todo">Por hacer</option>
            <option value="progress">En progreso</option>
            <option value="done">Listas</option>
          </Select>
          <Button colorScheme="brand">Nueva tarea</Button>
        </HStack>
      </HStack>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {filteredTasks.map((t: any) => (
          <Box key={t.id} p={4} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="semibold">{t.title}</Text>
              <StatusBadge status={t.status} />
            </HStack>
            <Text color="gray.600" _dark={{ color: 'gray.400' }}>{t.project}</Text>
            <HStack mt={3} justify="space-between">
              <Text fontSize="sm" color="gray.500">Vence: {t.due}</Text>
              <Text fontSize="sm" color="gray.500">Responsable: {t.assignee}</Text>
            </HStack>
          </Box>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
