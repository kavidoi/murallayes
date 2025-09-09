import { Box, Heading, Text, VStack } from '@chakra-ui/react'

export default function Conocimiento() {
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="lg">Conocimiento</Heading>
      <Box p={5} bg="white" _dark={{ bg: 'gray.800' }} borderWidth="1px" rounded="lg">
        <Text color="gray.600" _dark={{ color: 'gray.300' }}>
          Wiki interna, documentos, mejores prácticas y plantillas. (Mock)
        </Text>
      </Box>
    </VStack>
  )
}
