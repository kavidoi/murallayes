import { Box, Heading, Text, VStack } from '@chakra-ui/react'

export default function Calendario() {
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="lg">Calendario</Heading>
      <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
        <Text color="gray.600" _dark={{ color: 'gray.300' }}>
          Vista de calendario para eventos, entregas y fechas clave. (Mock)
        </Text>
      </Box>
    </VStack>
  )
}
