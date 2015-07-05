/**
 * Copyright 2010-2015 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package org.bson.jvm.nashorn;

import org.bson.codecs.configuration.CodecRegistries;
import org.bson.codecs.configuration.CodecRegistry;
import org.bson.jvm.BsonImplementation;

import jdk.nashorn.internal.objects.NativeString;
import jdk.nashorn.internal.runtime.ScriptObject;

/**
 * @author Tal Liron
 */
public class NashornBsonImplementation implements BsonImplementation
{
	//
	// BsonImplementation
	//

	public String getName()
	{
		return "Nashorn";
	}

	public int getPriority()
	{
		return 0;
	}

	public Class<?> getDocumentClass()
	{
		return ScriptObject.class;
	}

	public CodecRegistry getCodecRegistry( CodecRegistry next )
	{
		return CodecRegistries.fromRegistries(
			CodecRegistries.fromCodecs( new ConsStringCodec(), new NativeBooleanCodec(), new NativeDateCodec(), new NativeNumberCodec(), new NativeRegExpCodec(), new NativeStringCodec(), new UndefinedCodec() ),
			CodecRegistries.fromProviders( new NashornCodecProvider() ), next );
	}

	public Object toNativeString( String string )
	{
		return NativeString.constructor( true, null, string );
	}
}
