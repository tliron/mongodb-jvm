/**
 * Copyright 2010-2011 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.rhino.util;

import java.util.Date;
import java.util.regex.Pattern;

import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;
import org.mozilla.javascript.regexp.NativeRegExp;

/**
 * Conversion between native Rhino objects and JVM equivalents.
 * 
 * @author Tal Liron
 */
public class NativeRhino
{
	//
	// Static operations
	//

	public static Scriptable to( Number number )
	{
		return toNumber( number );
	}

	public static Scriptable to( String value )
	{
		// (The NativeString class is private in Rhino, but we can create
		// it indirectly like a regular object.)

		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newObject( scope, "String", new Object[]
		{
			value
		} );
	}

	public static Scriptable to( Date date )
	{
		// (The NativeDate class is private in Rhino, but we can create
		// it indirectly like a regular object.)

		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newObject( scope, "Date", new Object[]
		{
			date.getTime()
		} );
	}

	public static Scriptable to( String source, String optionsString )
	{
		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newObject( scope, "RegExp", new Object[]
		{
			source, optionsString
		} );
	}

	public static Scriptable to( Pattern pattern )
	{
		String regex = pattern.toString();

		// Note: JVM pattern does not support a "g" flag

		int flags = pattern.flags();
		String options = "";
		if( ( flags & Pattern.CASE_INSENSITIVE ) != 0 )
			options += 'i';
		if( ( flags & Pattern.MULTILINE ) != 0 )
			options += 'm';

		return to( regex, options );
	}

	public static Scriptable toNumber( Object value )
	{
		// (The NativeNumber class has a private constructor in Rhino, but we
		// can create it indirectly like a regular object.)

		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newObject( scope, "Number", new Object[]
		{
			value
		} );
	}

	public static Object from( Scriptable scriptable )
	{
		String className = scriptable.getClassName();
		if( className.equals( "Date" ) )
		{
			// Convert NativeDate to Date

			// (The NativeDate class is private in Rhino, but we can access
			// it like a regular object.)

			Object time = ScriptableObject.callMethod( scriptable, "getTime", null );
			if( time instanceof Number )
				return new Date( ( (Number) time ).longValue() );
		}
		else if( className.equals( "String" ) )
		{
			// Unpack NativeString

			return scriptable.toString();
		}

		return null;
	}

	public static String[] from( NativeRegExp regExp )
	{
		Object source = ScriptableObject.getProperty( regExp, "source" );

		Object isGlobal = ScriptableObject.getProperty( regExp, "global" );
		Object isIgnoreCase = ScriptableObject.getProperty( regExp, "ignoreCase" );
		Object isMultiLine = ScriptableObject.getProperty( regExp, "multiline" );

		// Note: JVM pattern does not support a "g" flag. Also, compiling
		// the pattern here is a waste of time.
		//
		// int flags = 0;
		// if( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean)
		// isIgnoreCase ).booleanValue() ) )
		// flags |= Pattern.CASE_INSENSITIVE;
		// if( ( isMultiLine instanceof Boolean ) && ( ( (Boolean)
		// isMultiLine ).booleanValue() ) )
		// flags |= Pattern.MULTILINE;
		// return Pattern.compile( source.toString(), flags );

		String options = "";
		if( ( isGlobal instanceof Boolean ) && ( ( (Boolean) isGlobal ).booleanValue() ) )
			options += "g";
		if( ( isIgnoreCase instanceof Boolean ) && ( ( (Boolean) isIgnoreCase ).booleanValue() ) )
			options += "i";
		if( ( isMultiLine instanceof Boolean ) && ( ( (Boolean) isMultiLine ).booleanValue() ) )
			options += "m";

		return new String[]
		{
			source.toString(), options
		};
	}

	public static Scriptable newObject()
	{
		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newObject( scope );
	}

	public static Scriptable newArray( int length )
	{
		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return context.newArray( scope, length );
	}

	public static Scriptable wrap( Object value )
	{
		Context context = Context.getCurrentContext();
		Scriptable scope = ScriptRuntime.getTopCallScope( context );
		return new NativeJavaObject( scope, value, value.getClass() );
	}
}
