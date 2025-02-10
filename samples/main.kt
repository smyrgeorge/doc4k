import com.example.test1
import com.example.test2
import test.TestWithPackage

@Doc4k
fun main() {
    fun test() {
        println("Hello, from main fun!")
    }

    println("Hello, from main fun!")
    test()
}

fun test() {
    println("Hello, from test fun!")
}

class Test(
    private val test1: Test1
) {
    private lateinit var test2: Test2
    private lateinit var test3: TestWithPackage

    @Doc4k
    fun test() {
        test3.foo()
        println("Hello, from Test.test fun!")
        if (true) {
            test2()
        }
    }

    fun test2() {
        fun test3() {
            println("Hello, from Test.test fun!")
            test1.test1()
            test2.test2()
        }
        println("Hello, from Test.test fun!")
        test3()
    }
}

class Test1 {
    fun test1() {
        println("Hello, from Test1.test1 fun!")
    }
}

class Test2 {
    fun test2() {
        fun t() {
            println("Hello, from Test2.test2 fun!")
        }

        println("Hello, from Test2.test2 fun!")
        if (true) {
            println("Hello, from Test2.test2 fun!")
        }
        while (true) {
            println("Hello, from Test2.test2 fun!")
        }
    }
}